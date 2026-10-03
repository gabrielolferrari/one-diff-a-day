import type { ReactNode } from 'react';

function inline(text: string): ReactNode[] {
  return text.split(/(`[^`]+`)/g).map((part, i) =>
    part.startsWith('`') && part.endsWith('`') ? <code key={i}>{part.slice(1, -1)}</code> : part,
  );
}

/** Just enough markdown for PR descriptions: `## ` headings, `- ` lists and inline code. */
export default function Markdown({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let list: string[] = [];

  const flushList = () => {
    if (list.length === 0) return;
    blocks.push(
      <ul key={blocks.length}>
        {list.map((item, i) => (
          <li key={i}>{inline(item)}</li>
        ))}
      </ul>,
    );
    list = [];
  };

  for (const line of text.trim().split('\n')) {
    if (line.startsWith('- ')) {
      list.push(line.slice(2));
      continue;
    }
    flushList();
    if (line.startsWith('## ')) blocks.push(<h3 key={blocks.length}>{inline(line.slice(3))}</h3>);
    else if (line.trim()) blocks.push(<p key={blocks.length}>{inline(line)}</p>);
  }
  flushList();

  return <div className="markdown">{blocks}</div>;
}
