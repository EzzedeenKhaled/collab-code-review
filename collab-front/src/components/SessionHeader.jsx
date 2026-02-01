import { Link } from "react-router-dom";
import { ArrowLeft, Copy, Play, Users } from "lucide-react";
import toast from "react-hot-toast";

const SessionHeader = ({ sessionId, isConnected, users, onRunCode }) => {
  const handleCopySessionId = () => {
    navigator.clipboard.writeText(sessionId);
    toast.success("Session ID copied! Share with your friends to join!");
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/"
            className="flex items-center text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Link>
          <div className="h-6 w-px bg-slate-300"></div>
          <h1 className="text-xl font-semibold text-slate-900">
            Session {sessionId}
            <button
              className="ml-2 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
              title="Copy Session ID"
              onClick={handleCopySessionId}
              type="button"
            >
              <Copy className="w-4 h-4 text-slate-500" />
            </button>
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <Users className="h-4 w-4" />
            <span className={isConnected ? "text-green-600" : "text-red-600"}>
              {isConnected
                ? `${users.length} user${users.length !== 1 ? "s" : ""}`
                : "Disconnected"}
            </span>
          </div>
          <button
            onClick={onRunCode}
            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm cursor-pointer"
          >
            <Play className="w-4 h-4 mr-2" />
            Run Code
          </button>
        </div>
      </div>
    </header>
  );
};

export default SessionHeader;
