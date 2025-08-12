import { Request, Response, NextFunction } from 'express';
import { TenantService } from '../services/tenant';

export interface TenantRequest extends Request {
  tenant?: {
    id: string;
    name: string;
    subdomain: string;
    contactEmail: string;
  };
}

export const extractTenant = async (req: TenantRequest, res: Response, next: NextFunction) => {
  const tenantSubdomain = req.headers['x-tenant'] || req.query.tenant;
  
  if (!tenantSubdomain) {
    return res.status(400).json({ error: 'Tenant identifier required' });
  }

  try {
    const tenant = await TenantService.getTenantBySubdomain(tenantSubdomain as string);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    req.tenant = tenant;
    next();
  } catch (error) {
    console.error('Tenant extraction error:', error);
    res.status(500).json({ error: 'Failed to retrieve tenant' });
  }
};

export const validateTenantAccess = (req: any, res: Response, next: NextFunction) => {
  if (!req.user || !req.tenant) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!TenantService.validateTenantAccess(req.user, req.tenant.id)) {
    return res.status(403).json({ error: 'Access denied to this tenant' });
  }

  next();
};
