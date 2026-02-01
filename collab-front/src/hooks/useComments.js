import { useEffect, useRef, useState } from "react";

export const useComments = (socket, sessionId) => {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentLine, setCommentLine] = useState(1);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const commentsEndRef = useRef(null);

  useEffect(() => {
    // Fetch initial comments
    fetch(`http://localhost:3001/api/sessions/${sessionId}/comments`)
      .then((res) => res.json())
      .then((data) => setComments(data))
      .catch((err) => console.error("Error fetching comments:", err));
  }, [sessionId]);

  useEffect(() => {
    if (!socket) return;

    socket.on("comment-added", (comment) => {
      console.log("New comment received:", comment);
      setComments((prev) => [...prev, comment]);
    });

    socket.on("comments-init", (initComments) => {
      console.log("Initial comments received:", initComments);
      setComments(initComments);
    });

    return () => {
      socket.off("comment-added");
      socket.off("comments-init");
    };
  }, [socket]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const handleAddComment = async (userId, userName, userColor) => {
    if (!commentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);

    try {
      const response = await fetch(
        `http://localhost:3001/api/sessions/${sessionId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: commentText,
            lineNumber: commentLine,
            userId,
            userName,
            userColor,
          }),
        },
      );

      if (response.ok) {
        setCommentText("");
      } else {
        console.error("Failed to add comment");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return {
    comments,
    commentText,
    setCommentText,
    commentLine,
    setCommentLine,
    isSubmittingComment,
    handleAddComment,
    commentsEndRef,
  };
};
