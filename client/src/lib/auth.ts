export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'teacher' | 'parent';
}

export interface LoginResponse {
  token: string;
  user: User;
}

export class AuthService {
  static getToken(): string | null {
    return localStorage.getItem("schoolconnect_token");
  }

  static getUser(): User | null {
    const userStr = localStorage.getItem("schoolconnect_user");
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  static isAuthenticated(): boolean {
    return !!(this.getToken() && this.getUser());
  }

  static hasRole(role: string): boolean {
    const user = this.getUser();
    return user?.role === role;
  }

  static hasAnyRole(roles: string[]): boolean {
    const user = this.getUser();
    return user ? roles.includes(user.role) : false;
  }

  static clearAuth(): void {
    localStorage.removeItem("schoolconnect_token");
    localStorage.removeItem("schoolconnect_user");
  }

  static setAuth(token: string, user: User): void {
    localStorage.setItem("schoolconnect_token", token);
    localStorage.setItem("schoolconnect_user", JSON.stringify(user));
  }

  static getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? {
      "Authorization": `Bearer ${token}`,
      "X-Tenant": "demo", // For demo purposes
    } : {
      "X-Tenant": "demo",
    };
  }
}
