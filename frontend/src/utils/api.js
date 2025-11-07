// Utility to get API URL based on current hostname
export const getApiUrl = () => {
  const envApiURL = import.meta.env.VITE_API_URL;
  
  // If accessing from network (not localhost), use network IP
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    const networkURL = `http://${window.location.hostname}:5000/api`;
    console.log('📱 Using network API URL:', networkURL);
    return networkURL;
  }
  
  console.log('💻 Using localhost API URL:', envApiURL);
  return envApiURL;
};

// Utility to get Socket.io URL
export const getSocketUrl = () => {
  const envSocketURL = import.meta.env.VITE_SOCKET_URL;
  
  // If accessing from network (not localhost), use network IP
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    const networkURL = `http://${window.location.hostname}:5000`;
    console.log('📱 Using network Socket URL:', networkURL);
    return networkURL;
  }
  
  console.log('💻 Using localhost Socket URL:', envSocketURL);
  return envSocketURL;
};
