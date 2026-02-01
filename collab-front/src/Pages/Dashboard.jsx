import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getUserId, getUserName } from "../utils/userUtils";

const Dashboard = () => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [joinSessionId, setJoinSessionId] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      setLoadingSessions(true);
      try {
        const userId = getUserId();
        const res = await fetch(
          `http://localhost:3001/api/sessions?userId=${userId}`,
        );
        if (res.ok) {
          const data = await res.json();
          setSessions(data.sessions || []);
        } else {
          setSessions([]);
        }
      } catch {
        setSessions([]);
      } finally {
        setLoadingSessions(false);
      }
    };
    fetchSessions();
  }, []);

  const handleCreate = async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const userId = getUserId();
      const userName = getUserName();

      const response = await fetch("http://localhost:3001/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          userName: userName,
          title: `Session ${new Date().toLocaleString()}`,
        }),
      });

      if (response.ok) {
        const session = await response.json();
        navigate(`/session/${session.id}`);
      } else {
        toast.error("Failed to create session. Please try again.");
      }
    } catch (error) {
      toast.error("Error creating session. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinSession = async () => {
    if (!joinSessionId.trim()) {
      toast.error("Please enter a session ID.");
      return;
    }
    setIsJoining(true);
    try {
      const response = await fetch(
        `http://localhost:3001/api/sessions/${joinSessionId.trim()}`,
      );
      if (response.ok) {
        navigate(`/session/${joinSessionId.trim()}`);
        setShowJoin(false);
        setJoinSessionId("");
      } else {
        toast.error("Session does not exist.");
      }
    } catch (err) {
      toast.error("Session does not exist.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col min-h-screen">
      <main className="flex-1 flex flex-col justify-center items-center px-6">
        <div className="w-full max-w-2xl">
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-6">
            <button
              className="inline-flex items-center px-8 py-5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors duration-200 text-xl w-full sm:w-auto cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleCreate}
              disabled={isCreating}
            >
              <Plus className="mr-3 h-6 w-6" />
              {isCreating ? "Creating Session..." : "Create New Session"}
            </button>
            <button
              className="inline-flex items-center px-8 py-5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors duration-200 text-xl w-full sm:w-auto cursor-pointer"
              onClick={() => setShowJoin(true)}
            >
              Join Session
            </button>
          </div>

          {showJoin && (
            <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-opacity-40">
              <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md flex flex-col items-center">
                <h2 className="text-2xl font-bold mb-6 text-slate-900 text-center">
                  Join a Session
                </h2>
                <input
                  type="text"
                  placeholder="Enter Session ID"
                  className="w-full p-4 border border-slate-200 rounded-lg text-lg mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={joinSessionId}
                  onChange={(e) => setJoinSessionId(e.target.value)}
                  disabled={isJoining}
                  autoFocus
                />
                <div className="flex w-full justify-end gap-3">
                  <button
                    className="px-6 py-3 rounded-lg bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 transition-colors text-lg cursor-pointer"
                    onClick={() => {
                      setShowJoin(false);
                      setJoinSessionId("");
                    }}
                    disabled={isJoining}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-6 py-3 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors text-lg cursor-pointer"
                    onClick={handleJoinSession}
                    disabled={isJoining}
                  >
                    {isJoining ? "Joining..." : "Join"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200 mt-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">
              Your Sessions
            </h2>
            {loadingSessions ? (
              <div className="text-center py-8 text-slate-500">Loading...</div>
            ) : sessions.length > 0 ? (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/session/${session.id}`)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          Session {session.id}
                        </h3>
                      </div>
                    </div>
                    <div className="text-sm text-slate-500">
                      {new Date(session.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-slate-400 mb-4">
                  <Plus className="h-12 w-12 mx-auto" />
                </div>
                <p className="text-slate-600 text-lg">
                  No sessions yet. Create your first session to get started!
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
