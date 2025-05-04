// Remove hardcoded API_BASE
export function getApiBase(): string {
  // Try window.__MIXTAPE_API_BASE__ if set by server, else env, else default
  if (typeof window !== 'undefined' && (window as any).__MIXTAPE_API_BASE__) {
    return (window as any).__MIXTAPE_API_BASE__;
  }
  // CRA env var
  if (process.env.REACT_APP_API_BASE) {
    return process.env.REACT_APP_API_BASE;
  }
  return 'http://localhost:4000';
}
