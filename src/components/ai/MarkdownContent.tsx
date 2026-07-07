import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

const components: Components = {
  h3: ({ children }) => (
    <h3 className="ai-md-heading flex items-center gap-1.5 mt-4 mb-1.5 first:mt-0">
      {children}
    </h3>
  ),
  ul: ({ children }) => <ul className="ai-md-list">{children}</ul>,
  li: ({ children }) => <li className="ai-md-li">{children}</li>,
  p: ({ children }) => <p className="ai-md-p">{children}</p>,
  strong: ({ children }) => <strong className="ai-md-strong">{children}</strong>,
};

export default function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="ai-markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
