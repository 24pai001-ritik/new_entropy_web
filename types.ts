
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

export interface ImpactfulWord {
  text: string;
  start: number;
  end: number;
  emotionalIntent?: string;
}

export interface ImpactfulImage {
  url: string;
  word: string;
  start: number;
  end: number;
}
