/**
 * Dynamically resolves the backend API URL.
 * When running in the browser, it uses the current window location's hostname
 * so that other devices on the same network can access the backend server at port 3001.
 * When server-rendering, it defaults to localhost.
 */
export function getApiUrl(path: string): string {
  const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";
  const cleanPath = path.startsWith("/") ? path.substring(1) : path;
  return `http://${hostname}:3001/${cleanPath}`;
}
