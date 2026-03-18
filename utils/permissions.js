// utils/permissions.js
const SCOPES = {
  canWrite: "can-write",
  canCreate: "can-create",
  canEdit: "can-edit",
  canDelete: "can-delete",
  canView: "can-view",
};

const ROLES = {
  system_admin: "Super Administrador",
  bussiness_admin: "Mecanico Taller",
  operator: "Mecanico",
  client: "Usuario",
};

const { canCreate, canEdit, canView, canDelete, canWrite } = SCOPES;

const getRoleName = (role) => ROLES[role] || "";

const PERMISSIONS = {
  // OPERATOR
  operator: {
    adminScreen: {
      pagePermissions: [],
    },
    orders: {
      pagePermissions: [],
    },
    categories: {
      pagePermissions: [],
    },
    products: {
      pagePermissions: [],
    },

    brands: {
      pagePermissions: [],
    },

    users: {
      pagePermissions: [],
    },
    config: {
      pagePermissions: [],
    },
    banners: {
      pagePermissions: [],
    },
    discountCodes: {
      pagePermissions: [],
    },
    forum: {
      pagePermissions: [canView, canCreate],
    },
  },

  // BUSSINESS_ADMIN
  bussiness_admin: {
    adminScreen: {
      pagePermissions: [canView],
      fields: {
        access: [canView],
      },
    },
    orders: {
      pagePermissions: [],
    },
    categories: {
      pagePermissions: [],
    },
    products: {
      pagePermissions: [],
    },

    forum: {
      pagePermissions: [canView, canWrite],
    },
  
    brands: {
      pagePermissions: [],
    },

    users: {
      pagePermissions: [],
    },
    config: {
      pagePermissions: [],
    },
    banners: {
      pagePermissions: [],
    },
    discountCodes: {
      pagePermissions: [],
    },
    siteSettings: {
      pagePermissions: [],
    },
  },

  // SYSTEM_ADMIN
  system_admin: {
    adminScreen: {
      pagePermissions: [canView],
      fields: {
        access: [canView],
      },
    },
    orders: {
      pagePermissions: [canView, canEdit],
      fields: {
        paid: [canEdit],
        deliver: [canEdit],
        cancel: [canEdit],
      },
    },
    categories: {
      pagePermissions: [canWrite],
      fields: {
        products: [canWrite],
      },
    },
    products: {
      pagePermissions: [canWrite],
      fields: {
        price: [canEdit],
        stock: [canWrite],
      },
    },
    siteSettings: {
      pagePermissions: [canWrite],
    },

    // 👇 NUEVO  Facuu
    brands: {
      pagePermissions: [canWrite],
      fields: {},
    },


    users: {
      pagePermissions: [canWrite],
      fields: {
        client: [canCreate],
        operator: [canCreate],
        system_admin: [canCreate],
        bussiness_admin: [canCreate],
      },
    },
    config: {
      pagePermissions: [canWrite],
    },
    banners: {
      pagePermissions: [canView, canEdit, canCreate, canDelete],
    },
    discountCodes: {
      pagePermissions: [canView, canEdit, canCreate, canDelete],
    },
  },

  // CLIENT
  client: {
    adminScreen: {
      pagePermissions: [],
      fields: {
        access: [],
      },
    },
    orders: {
      pagePermissions: [],
      fields: {
        paid: [],
        deliver: [],
        cancel: [],
      },
    },
    categories: {
      pagePermissions: [],
      fields: {
        products: [],
      },
    },
    products: {
      pagePermissions: [canView],
      fields: {
        price: [],
        stock: [],
      },
    },

    brands: {
      pagePermissions: [],
      fields: {},
    },

    users: {
      pagePermissions: [],
      fields: {
        client: [],
        operator: [],
        system_admin: [],
        bussiness_admin: [],
      },
    },
    config: {
      pagePermissions: [],
    },
    banners: {
      pagePermissions: [],
    },
    discountCodes: {
      pagePermissions: [],
    },
    forum: {
      pagePermissions: [canView, canCreate, canEdit, canDelete],
    },
  },
};

// ================== CORE ==================
function hasPermission(role, fn, scopes = [], field) {

  if (!ROLES[role]) return false;

  const rolePerms = PERMISSIONS[role];
  if (!rolePerms) return false;

  const fnPerms = rolePerms[fn];
  if (!fnPerms) return false;

  const perms = field
    ? fnPerms.fields && fnPerms.fields[field]
    : fnPerms.pagePermissions;

  if (!perms || !Array.isArray(perms) || perms.length === 0) return false;

  if (perms.includes(SCOPES.canWrite)) return true;

  if (!scopes || scopes.length === 0) return true;

  return scopes.every((scope) => perms.includes(scope));
}

// ================== MIDDLEWARES ==================
const requirePermission = (fn, scopes = [], field) => {
  return (req, res, next) => {
    const role = req.user?.role || "client";

    const ok = hasPermission(role, fn, scopes, field);
    if (!ok) {
      return res
        .status(403)
        .send({ message: "Not authorized: insufficient permissions" });
    }

    next();
  };
};

const requireAnyPermission = (rules = []) => {
  return (req, res, next) => {
    const role = req.user?.role || "client";

    const ok = rules.some((rule) =>
      hasPermission(role, rule.fn, rule.scopes || [], rule.field)
    );

    if (!ok) {
      return res
        .status(403)
        .send({ message: "Not authorized: insufficient permissions" });
    }

    next();
  };
};

export {
  PERMISSIONS,
  ROLES,
  SCOPES,
  getRoleName,
  hasPermission,
  requirePermission,
  requireAnyPermission,
};
