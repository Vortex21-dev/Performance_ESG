import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Loader } from 'lucide-react';

interface PrivateRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'enterprise';
}

export function PrivateRoute({ children, requiredRole }: PrivateRouteProps) {
  const { user, profile, loading, impersonatedOrganization } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  // Gestion des accès selon les rôles
  if (requiredRole) {
    if (requiredRole === 'admin' && profile.role !== 'admin') {
      return <Navigate to="/enterprise/dashboard" replace />;
    }
    
    if (requiredRole === 'enterprise') {
      // Permettre l'accès aux routes enterprise pour :
      // - Les admins (toujours)
      // - Les admins qui impersonnent une organisation
      // - Les utilisateurs enterprise
      // - Les contributeurs et validateurs (nouveaux)
      const allowedRoles = ['admin', 'enterprise', 'contributor', 'validator'];
      const hasAccess = allowedRoles.includes(profile.role) || 
                       (profile.role === 'admin' && impersonatedOrganization);
      
      if (!hasAccess) {
        return <Navigate to="/login" replace />;
      }
    }
  }

  return <>{children}</>;
}