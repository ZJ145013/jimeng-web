import React, { useState, useMemo } from 'react';
import { Copy, Check, Terminal, AlertTriangle } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from 'sonner';

interface CurlPreviewProps {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any;
}

const CurlPreview: React.FC<CurlPreviewProps> = ({ method, url, headers, body }) => {
    const [copied, setCopied] = useState(false);
    const [localFilePath, setLocalFilePath] = useState('');

    const hasFile = useMemo(() => {
        if (body instanceof FormData) {
            try {
                // @ts-ignore
                for (const value of body.values()) {
                    if (value instanceof File) return true;
                }
            } catch (e) {
                return false;
            }
        }
        return false;
    }, [body]);

    const generateCurl = () => {
        let curl = `curl -X ${method} "${url}" \\\n`;

        Object.entries(headers).forEach(([key, value]) => {
            if (key.toLowerCase() === 'content-type' && value.includes('multipart/form-data')) {
                return;
            }
            curl += `  -H "${key}: ${value}" \\\n`;
        });

        if (body) {
            if (body instanceof FormData) {
                try {
                    // @ts-ignore
                    for (const [key, value] of body.entries()) {
                        if (value instanceof File) {
                            const path = localFilePath.trim() || '/path/to/your/file';
                            const finalPath = path.startsWith('@') ? path : `@${path}`;
                            curl += `  -F "${key}=${finalPath}" \\\n`;
                        } else {
                            curl += `  -F "${key}=${value}" \\\n`;
                        }
                    }
                    if (curl.endsWith(' \\\n')) {
                        curl = curl.slice(0, -3);
                    }
                } catch (e) {
                    curl += `  # FormData binary content`;
                }
            } else {
                curl += `  -d '${JSON.stringify(body, null, 2)}'`;
            }
        }

        return curl;
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generateCurl());
        setCopied(true);
        toast.success('Curl 命令已复制');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="rounded-lg overflow-hidden border border-gray-700 bg-[#1e1e1e] shadow-sm">
            <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-gray-700">
                <div className="flex items-center gap-2 text-gray-300 text-sm font-medium">
                    <Terminal className="w-4 h-4" />
                    <span>Curl 预览</span>
                </div>
                <button
                    onClick={handleCopy}
                    className="p-1.5 hover:bg-gray-600 rounded-md text-gray-400 hover:text-white transition-colors"
                    title="复制到剪贴板"
                >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
            </div>

            {hasFile && (
                <div className="bg-[#252526] border-b border-gray-700 px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-xs text-gray-400 font-medium">
                            自定义文件绝对路径（仅影响下方生成代码）：
                        </label>
                        <span className="text-[10px] text-gray-500 bg-[#1e1e1e] border border-gray-700 px-1.5 py-0.5 rounded">
                            不影响网页调用
                        </span>
                    </div>
                    <input
                        type="text"
                        value={localFilePath}
                        onChange={(e) => setLocalFilePath(e.target.value)}
                        placeholder="例如: /Users/username/Downloads/image.png"
                        className="w-full bg-[#1e1e1e] border border-gray-600 rounded px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-indigo-500 transition-colors placeholder-gray-600 font-mono"
                    />
                </div>
            )}

            <div className="text-xs">
                <SyntaxHighlighter
                    language="bash"
                    style={vscDarkPlus}
                    customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}
                    wrapLongLines={true}
                >
                    {generateCurl()}
                </SyntaxHighlighter>
            </div>

            {hasFile && (
                <div className="px-4 py-3 bg-yellow-500/10 border-t border-yellow-500/20 text-yellow-200/90 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-yellow-500" />
                    <div className="space-y-1">
                        <p className="font-medium">需要手动替换路径</p>
                        <p className="opacity-80 leading-relaxed">
                            浏览器出于安全限制无法自动获取文件的真实路径。请在上方输入框填入路径，或在复制命令后手动修改 <code className="bg-yellow-900/40 px-1 py-0.5 rounded text-yellow-100 mx-0.5">@</code> 后面的内容。
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CurlPreview;