import { Send } from "lucide-react";

const CommentForm = ({
  commentText,
  setCommentText,
  commentLine,
  setCommentLine,
  codeLines,
  isSubmittingComment,
  onAddComment,
}) => {
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onAddComment();
    }
  };

  return (
    <div className="border-t border-slate-200 p-4">
      <div className="flex items-center mb-2">
        <label className="mr-2 text-sm text-slate-600">Line:</label>
        <input
          type="number"
          min={1}
          max={codeLines}
          value={commentLine}
          onChange={(e) => setCommentLine(Number(e.target.value))}
          className="w-16 p-1 border border-slate-200 rounded text-sm mr-2"
        />
        <span className="text-xs text-slate-400">of {codeLines}</span>
      </div>

      <div className="flex space-x-2">
        <textarea
          placeholder="Add a comment..."
          className="flex-1 p-3 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyPress={handleKeyPress}
        />
      </div>

      <button
        className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        onClick={onAddComment}
        disabled={!commentText.trim() || isSubmittingComment}
        type="button"
      >
        <Send className="h-4 w-4 mr-2" />
        {isSubmittingComment ? "Adding..." : "Add Comment"}
      </button>
    </div>
  );
};

export default CommentForm;
