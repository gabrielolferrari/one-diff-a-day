import type { Challenge } from '../types';

export const challengerGoProfileCache: Challenge = {
  id: 'challenger-go-profile-cache',
  level: 'challenger',
  language: 'go',
  title: 'Cache em memória para o serviço de perfis',
  author: 'rafael-backend',
  branch: 'perf/profile-cache',
  description: `
## Contexto
O \`GET /profiles/:id\` está com p99 de 800ms nos horários de pico. Quase todo o tempo é a query no Postgres, e o mesmo perfil é lido várias vezes por minuto.

## O que mudou
- Novo \`Cache\` em memória com TTL, sem dependência externa
- \`Service.GetProfile\` consulta o cache antes do repositório
- TTL de 5 minutos, perfis mudam pouco
- Teste cobrindo o caminho do cache

## Observações
Os perfis são editados pelo próprio usuário na tela de configurações. O serviço roda com várias goroutines atendendo requests em paralelo.

## Como testar
- \`go test ./profile/...\`
`,
  files: [
    {
      path: 'profile/cache.go',
      diff: `
@@ -0,0 +1,39 @@
+package profile
+
+import (
+    "sync"
+    "time"
+)
+
+type entry struct {
+    value     *Profile
+    expiresAt time.Time
+}
+
+// Cache stores profiles in memory for a fixed TTL.
+type Cache struct {
+    mu    sync.Mutex
+    items map[string]entry
+    ttl   time.Duration
+}
+
+func NewCache(ttl time.Duration) *Cache {
+    return &Cache{
+        items: make(map[string]entry),
+        ttl:   ttl,
+    }
+}
+
+func (c *Cache) Get(id string) (*Profile, bool) {
+    e, ok := c.items[id]
+    if !ok || time.Now().After(e.expiresAt) {
+        return nil, false
+    }
+    return e.value, true
+}
+
+func (c *Cache) Set(id string, p *Profile) {
+    c.mu.Lock()
+    defer c.mu.Unlock()
+    c.items[id] = entry{value: p, expiresAt: time.Now().Add(c.ttl)}
+}
`,
    },
    {
      path: 'profile/service.go',
      diff: `
@@ -1,24 +1,39 @@
 package profile
 
 import (
     "context"
+    "time"
 )
 
 type Service struct {
-    repo Repository
+    repo  Repository
+    cache *Cache
 }
 
 func NewService(repo Repository) *Service {
-    return &Service{repo: repo}
+    return &Service{
+        repo:  repo,
+        cache: NewCache(5 * time.Minute),
+    }
 }
 
 func (s *Service) GetProfile(ctx context.Context, id string) (*Profile, error) {
-    return s.repo.FindByID(ctx, id)
+    if p, ok := s.cache.Get(id); ok {
+        return p, nil
+    }
+
+    p, err := s.repo.FindByID(ctx, id)
+    if err != nil {
+        return nil, err
+    }
+
+    s.cache.Set(id, p)
+    return p, nil
 }
 
 func (s *Service) UpdateProfile(ctx context.Context, p *Profile) error {
     if err := p.Validate(); err != nil {
         return err
     }
     return s.repo.Save(ctx, p)
 }
`,
    },
    {
      path: 'profile/service_test.go',
      diff: `
@@ -0,0 +1,39 @@
+package profile
+
+import (
+    "context"
+    "testing"
+)
+
+type fakeRepo struct {
+    calls   int
+    profile *Profile
+}
+
+func (f *fakeRepo) FindByID(ctx context.Context, id string) (*Profile, error) {
+    f.calls++
+    return f.profile, nil
+}
+
+func (f *fakeRepo) Save(ctx context.Context, p *Profile) error {
+    return nil
+}
+
+func TestGetProfile_UsesCache(t *testing.T) {
+    repo := &fakeRepo{profile: &Profile{ID: "42", Name: "Ada"}}
+    svc := NewService(repo)
+
+    first, err := svc.GetProfile(context.Background(), "42")
+    if err != nil {
+        t.Fatalf("unexpected error: %v", err)
+    }
+
+    second, err := svc.GetProfile(context.Background(), "42")
+    if err != nil {
+        t.Fatalf("unexpected error: %v", err)
+    }
+
+    if first.Name != second.Name {
+        t.Errorf("expected same profile, got %q and %q", first.Name, second.Name)
+    }
+}
`,
    },
  ],
  hints: [
    'A seção de observações descreve duas coisas sobre como o serviço é usado. Cada uma esconde um problema.',
    'Compare Get e Set no cache.go. E pense no que acontece com uma entrada depois que ela expira.',
    'Nem todo problema está nas linhas alteradas: olhe o UpdateProfile. E pergunte se o teste falharia sem o cache.',
  ],
  plantedIssues: [
    {
      location: 'profile/cache.go, método Get',
      category: 'bug',
      severity: 'high',
      description:
        'Get lê o map sem pegar o mutex, enquanto Set escreve com lock. Com várias goroutines isso é data race e o runtime do Go pode abortar o processo com "concurrent map read and map write". Get precisa de c.mu.Lock() (ou trocar para sync.RWMutex com RLock).',
    },
    {
      location: 'profile/service.go, UpdateProfile (linhas sem alteração no diff)',
      category: 'bug',
      severity: 'high',
      description:
        'UpdateProfile salva no banco mas não invalida nem atualiza o cache. O usuário edita o próprio perfil e continua vendo o dado antigo por até 5 minutos, o que a descrição do PR deixa claro que é o fluxo principal. O problema está no código que o PR não alterou.',
    },
    {
      location: 'profile/cache.go, estrutura do Cache',
      category: 'performance',
      severity: 'medium',
      description:
        'Entradas expiradas nunca são removidas, só ignoradas no Get. Cada perfil lido fica no map para sempre, então a memória cresce sem limite com a base de usuários. Falta eviction (limpeza periódica, remoção no Get ou um limite de tamanho com LRU).',
    },
    {
      location: 'profile/service_test.go, TestGetProfile_UsesCache',
      category: 'tests',
      severity: 'medium',
      description:
        'O teste passaria mesmo sem cache nenhum: ele só compara o Name das duas chamadas. O fakeRepo já conta chamadas, mas o teste nunca verifica repo.calls == 1. Também não há teste para expiração nem para concorrência (go test -race).',
    },
  ],
};
