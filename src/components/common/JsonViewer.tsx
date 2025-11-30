import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface JsonViewerProps {
    data: any;
    title?: string;
}

const JsonViewer: React.FC<JsonViewerProps> = ({ data, title = '响应结果' }) => {
    return (
        <div className="rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm h-full flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <span className="font-medium text-sm text-gray-700">{title}</span>
                <span className="text-xs text-gray-500 font-mono">JSON</span>
            </div>
            <div className="flex-1 overflow-auto bg-[#1e1e1e]">
                <SyntaxHighlighter
                    language="json"
                    style={vscDarkPlus}
                    customStyle={{ margin: 0, padding: '1rem', minHeight: '100%' }}
                    wrapLongLines={true}
                >
                    {JSON.stringify(data, null, 2)}
                </SyntaxHighlighter>
            </div>
        </div>
    );
};

export default JsonViewer;