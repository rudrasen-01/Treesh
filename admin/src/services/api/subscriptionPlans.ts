import { api } from "./config";

export interface AdminSubscriptionPlan {
  _id: string;
  name: string;
  code: string;
  description?: string;
  price: number;
  currency: string;
  features: string[];
  icon?: string;
  color?: string;
  sortOrder?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSubscriptionPlanPayload {
  name: string;
  code: string;
  description?: string;
  price: number;
  currency?: string;
  features?: string[];
  icon?: string;
  color?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface AdminSubscriptionPurchase {
  _id: string;
  subscriberId?: {
    _id: string;
    username?: string;
    name?: string;
    email?: string;
  };
  planId?: {
    _id: string;
    name?: string;
    code?: string;
  };
  planName: string;
  planCode: string;
  price: number;
  amount: number;
  currency: string;
  quantity: number;
  status: string;
  paymentStatus: string;
  orderId: string;
  paymentId?: string;
  startsAt?: string;
  endsAt?: string;
  createdAt: string;
}

export const subscriptionPlanService = {
  async getPlans(): Promise<AdminSubscriptionPlan[]> {
    const response = await api.get("/api/admin/subscription-plans");
    return response.data?.data || [];
  },

  async createPlan(payload: CreateSubscriptionPlanPayload): Promise<AdminSubscriptionPlan> {
    const response = await api.post("/api/admin/subscription-plans", payload);
    return response.data?.data;
  },

  async updatePlan(id: string, payload: Partial<CreateSubscriptionPlanPayload>): Promise<AdminSubscriptionPlan> {
    const response = await api.put(`/api/admin/subscription-plans/${id}`, payload);
    return response.data?.data;
  },

  async deactivatePlan(id: string): Promise<AdminSubscriptionPlan> {
    const response = await api.delete(`/api/admin/subscription-plans/${id}`);
    return response.data?.data;
  },

  async getPurchases(page = 1, limit = 20): Promise<{ items: AdminSubscriptionPurchase[]; total: number }> {
    const response = await api.get(`/api/admin/subscription-purchases?page=${page}&limit=${limit}`);
    return {
      items: response.data?.data || [],
      total: response.data?.pagination?.total || 0,
    };
  },
};
