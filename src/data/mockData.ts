export interface Color {
  hex: string;
  name?: string;
  usage?: string;
  percentage: number;
}

export interface WebsiteVersion {
  version: string;
  date: string;
  colors: Color[]; // Kept for backward compatibility, same as topColors
  topColors?: Color[];
  textColors?: Color[];
  allColors?: Color[];
}

export interface WebsiteData {
  id: string;
  name: string;
  url: string;
  description: string;
  logo?: string;
  category: string;
  style: 'Minimalist' | 'Dark Mode' | 'Colorful' | 'Gradient' | 'Clean';
  primaryColorFamily: string;
  likes: number;
  topColors: Color[];
  allColors: Color[];
  textColors: Color[];
  trendingColors: Color[];
  lastUpdated: string;
  versions: WebsiteVersion[];
  quote?: string;
}

import { realSites } from './realSites';

export const websites: WebsiteData[] = realSites;
