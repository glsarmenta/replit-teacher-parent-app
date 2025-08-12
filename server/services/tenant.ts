import { storage } from '../storage';
import type { Tenant } from '@shared/schema';

export class TenantService {
  static async getTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
    return storage.getTenantBySubdomain(subdomain);
  }

  static async createTenant(tenantData: {
    name: string;
    subdomain: string;
    contactEmail: string;
    phone?: string;
    address?: string;
  }) {
    // Validate subdomain is unique
    const existing = await storage.getTenantBySubdomain(tenantData.subdomain);
    if (existing) {
      throw new Error('Subdomain already exists');
    }

    return storage.createTenant(tenantData);
  }

  static validateTenantAccess(user: any, tenantId: string): boolean {
    return user.tenantId === tenantId;
  }
}
