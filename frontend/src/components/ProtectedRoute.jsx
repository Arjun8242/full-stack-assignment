function ProtectedRoute({ children }) {
  // Simply render children - let the component handle auth check
  return children;
}

export default ProtectedRoute;
