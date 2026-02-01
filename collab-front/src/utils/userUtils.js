export const getUserId = () => {
  let userId = localStorage.getItem("userId");
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("userId", userId);
  }
  return userId;
};

export const getUserName = () => {
  let userName = localStorage.getItem("userName");
  if (!userName) {
    userName = `User${Math.floor(Math.random() * 1000)}`;
    localStorage.setItem("userName", userName);
  }
  return userName;
};

export const generateUserColor = () => {
  return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
};

export const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};
