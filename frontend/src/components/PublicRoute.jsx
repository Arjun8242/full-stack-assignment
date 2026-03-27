function PublicRoute({ children }) {
  // Simply render children - no need to check auth here
  return children;
}

export default PublicRoute;
