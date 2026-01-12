
export interface ProductStep {
  title: string;
  description: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  features: string[];
  steps?: ProductStep[];
  detailedDescription?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  recommended?: boolean;
}
