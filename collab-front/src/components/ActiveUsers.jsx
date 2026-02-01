const ActiveUsers = ({ users, typingUsers }) => {
  return (
    <div className="p-4 border-b border-slate-200">
      <div className="text-sm font-medium text-slate-700 mb-2">
        Active Users:
      </div>
      {users.length > 0 ? (
        <div className="space-y-2">
          {users.map((user) => (
            <div key={user.id} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: user.color }}
              ></div>
              <span className="text-sm text-slate-600">{user.name}</span>
              {typingUsers.has(user.id) && (
                <span className="text-xs text-slate-400 italic">typing...</span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-slate-500">Only you</div>
      )}
    </div>
  );
};

export default ActiveUsers;
