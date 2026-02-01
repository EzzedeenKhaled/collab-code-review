import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";

const TypingIndicators = ({ typingUsers }) => {
  if (typingUsers.size === 0) return null;

  return (
    <div className="absolute bottom-2 left-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg">
      <div className="flex items-center space-x-2">
        {Array.from(typingUsers.entries()).map(
          ([userId, { userName, userColor }]) => (
            <div key={userId} className="flex items-center space-x-1">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: userColor }}
              ></div>
              <span className="text-xs text-slate-600">
                {userName} is typing...
              </span>
            </div>
          ),
        )}
      </div>
    </div>
  );
};

const CodeEditor = ({
  code,
  isConnected,
  typingUsers,
  runOutput,
  onCodeChange,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Code Review</h2>
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <div
              className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
            ></div>
            <span>{isConnected ? "Live" : "Offline"}</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <CodeMirror
          value={code}
          height="600px"
          extensions={[javascript()]}
          onChange={onCodeChange}
          theme="light"
          className="text-sm"
        />
        <TypingIndicators typingUsers={typingUsers} />
      </div>

      <div className="px-6 py-2 border-t border-slate-200 bg-slate-50">
        <div className="font-mono text-xs text-slate-700 whitespace-pre-wrap">
          <strong>Output:</strong>
          <div>{runOutput}</div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
