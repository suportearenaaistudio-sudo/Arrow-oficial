import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div
      className="flex min-h-[60vh] items-center justify-center"
      style={{ background: 'var(--arrow-bg)', color: 'var(--arrow-text-primary)' }}
    >
      <div className="text-center arrow-card p-10 max-w-md">
        <h1 className="mb-2 text-4xl font-bold arrow-gradient-text">404</h1>
        <p className="mb-6 text-sm" style={{ color: 'var(--arrow-text-secondary)' }}>
          Página não encontrada: <code>{location.pathname}</code>
        </p>
        <Link
          to="/"
          className="inline-flex px-5 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: 'var(--arrow-accent)', color: 'white' }}
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
