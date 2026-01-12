import React from 'react';
import { Bot, Video, FileSearch, Zap, Shield, Repeat, Upload, Search, Settings, Rocket, Play, Share, BarChart3, Binary, Eye } from 'lucide-react';
import { Product, BlogPost, PricingPlan } from './types';

export const PRODUCTS: Product[] = [
  {
    id: 'chatbot-maker',
    title: '5-Minute Chatbot Maker',
    description: 'Autonomous chatbots that learn from your business data in real-time.',
    detailedDescription: 'Empower your customer support with agents that don’t just follow scripts. Our RL-driven chatbots observe user frustration and reward-optimize their paths to resolution.',
    icon: 'Bot',
    color: '#4FD1FF',
    features: ['Instant Data Training', 'Self-Improving Responses', 'WhatsApp/Web Integration', 'Sentiment Reward Mapping'],
    steps: [
      { title: 'Ingest', description: 'Upload raw PDFs, docs, or site URLs for the AI to digest.' },
      { title: 'Observe', description: 'AI identifies core business logic patterns and data clusters.' },
      { title: 'Policy', description: 'RL agent generates response policies based on business goals.' },
      { title: 'Deploy', description: 'Live in 5 minutes with a simple 1-click script embed.' }
    ]
  },
  {
    id: 'video-gen',
    title: 'Smart Video Engine',
    description: 'Transform descriptions into high-converting marketing videos effortlessly.',
    detailedDescription: 'Dynamic video generation that adapts to viewer engagement data. Our engine iterates on visual hooks based on what keeps your specific audience watching.',
    icon: 'Video',
    color: '#3B6DFF',
    features: ['Voice-Sync Avatars', 'Automated Storyboarding', 'Multi-Language Support', 'Engagement Feedback Loops'],
    steps: [
      { title: 'Prompt', description: 'Describe your marketing hook or script idea in natural language.' },
      { title: 'Asset Sync', description: 'AI selects visual style, tone, and appropriate voice avatars.' },
      { title: 'Render', description: 'Cloud-based synthesis of 4K assets and synchronized audio.' },
      { title: 'Optimize', description: 'A/B variations generated automatically based on engagement data.' }
    ]
  },
  {
    id: 'research-helper',
    title: 'Research Co-Pilot',
    description: 'Synthesize thousands of pages into actionable business insights.',
    detailedDescription: 'Sifting through market noise is hard. Our co-pilot maps complex relationships between global trends and local MSME opportunities.',
    icon: 'FileSearch',
    color: '#8B5CF6',
    features: ['Market Gap Analysis', 'Trend Prediction', 'Citation Tracking', 'Cross-Domain Synthesis'],
    steps: [
      { title: 'Scan', description: 'Monitor global markets, news, and competitor data streams.' },
      { title: 'Extract', description: 'Identify non-obvious correlations and emerging market gaps.' },
      { title: 'Synthesize', description: 'Generate structured, plain-language strategy reports.' },
      { title: 'Refine', description: 'Update insights automatically as fresh data flows into the node.' }
    ]
  }
];

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'core',
    name: 'Core Node',
    price: '₹0',
    period: '/month',
    features: ['1 Agent Environment', 'Basic RL Loop', '500 Messages/mo', 'Community Support']
  },
  {
    id: 'sigma',
    name: 'Sigma Node',
    price: '₹2,499',
    period: '/month',
    recommended: true,
    features: ['5 Agent Environments', 'Advanced Reward Optimization', 'Unlimited Training Data', 'Priority Support', 'Custom Integrations']
  },
  {
    id: 'neural',
    name: 'Neural Node',
    price: 'Custom',
    period: '',
    features: ['Full Network Access', 'Proprietary RL Training', 'Dedicated Support Node', 'On-Premise Deployment', 'SLA Guarantees']
  }
];

export const BLOG_POSTS: BlogPost[] = [
  {
    id: '1',
    title: 'The RL Advantage: Why MSMEs are the New AI Frontier',
    excerpt: 'Deep dive into how Reinforcement Learning allows small businesses to compete with giants by optimizing local supply chains.',
    date: 'Jan 24, 2024',
    category: 'Research'
  },
  {
    id: '2',
    title: 'Agentic Workflows vs. Simple LLMs',
    excerpt: 'Understanding why "Agents" that take actions and learn from rewards are superior to static chat interfaces.',
    date: 'Feb 12, 2024',
    category: 'Engineering'
  },
  {
    id: '3',
    title: 'Building for Bharat: Scaling AI in Tier 2 Cities',
    excerpt: 'Exploring the technical challenges of deploying low-latency RL models in areas with intermittent connectivity.',
    date: 'Mar 05, 2024',
    category: 'Vision'
  }
];

export const WHY_US = [
  {
    title: 'AI that Learns',
    description: 'Our systems dont just follow rules; they improve with every interaction via RL loops.',
    icon: <Repeat className="w-8 h-8 text-[#4FD1FF]" />
  },
  {
    title: 'Built for MSMEs',
    description: 'Affordable, easy-to-use tools designed for the unique needs of Indian businesses.',
    icon: <Zap className="w-8 h-8 text-[#3B6DFF]" />
  },
  {
    title: 'Autonomous Systems',
    description: 'Set it and forget it. Our agents handle workflows while you focus on growth.',
    icon: <Shield className="w-8 h-8 text-[#8B5CF6]" />
  }
];
