import React from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../services/auth.service.js';
import { hasPermission, SCOPES } from '../utils/permissionsFront.js';

export default function PermissionWrapper({ fn, scopes = [], children }) {
  const user = getCurrentUser();

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  const allowed = hasPermission(user.role, fn, scopes);

  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  return children;
}
