import type { Challenge } from '../types';

export const lightPythonOrdersPagination: Challenge = {
  id: 'light-python-orders-pagination',
  level: 'light',
  language: 'python',
  title: 'Adiciona paginação na listagem de pedidos',
  author: 'marina-dev',
  branch: 'feat/orders-pagination',
  description: `
## Contexto
A listagem de pedidos no painel admin está lenta para lojistas com muitos pedidos, porque o endpoint retorna tudo de uma vez.

## O que mudou
- \`GET /orders\` agora aceita \`page\` e \`page_size\`
- \`page\` começa em 1, como o front já espera
- \`page_size\` tem limite de 100

## Como testar
- \`curl "localhost:5000/orders?page=1&page_size=20"\`
`,
  files: [
    {
      path: 'orders/routes.py',
      diff: `
@@ -1,11 +1,28 @@
 from flask import Blueprint, jsonify, request
 
 from .models import Order
 
 orders_bp = Blueprint("orders", __name__)
 
+DEFAULT_PAGE_SIZE = 20
+MAX_PAGE_SIZE = 100
+
 
 @orders_bp.get("/orders")
 def list_orders():
-    orders = Order.query.order_by(Order.created_at.desc()).all()
-    return jsonify([o.to_dict() for o in orders])
+    page = int(request.args.get("page", 1))
+    page_size = min(int(request.args.get("page_size", DEFAULT_PAGE_SIZE)), MAX_PAGE_SIZE)
+
+    offset = page * page_size
+    orders = (
+        Order.query.order_by(Order.created_at.desc())
+        .offset(offset)
+        .limit(page_size)
+        .all()
+    )
+
+    return jsonify({
+        "page": page,
+        "page_size": page_size,
+        "items": [o.to_dict() for o in orders],
+    })
`,
    },
  ],
  hints: [
    'Leia a descrição do PR com atenção e compare cada promessa com o que o código faz.',
    'Simule a primeira requisição do front: page=1 e page_size=20. Quais pedidos voltam?',
    'Olhe o cálculo do offset e lembre de onde a contagem de páginas começa.',
  ],
  plantedIssues: [
    {
      location: 'orders/routes.py, cálculo do offset',
      category: 'bug',
      severity: 'high',
      description:
        'A página começa em 1, mas o offset é calculado como page * page_size. Com page=1 o endpoint pula os primeiros 20 pedidos, justamente os mais recentes. O correto é (page - 1) * page_size, validando page >= 1.',
    },
  ],
};
