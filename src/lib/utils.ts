import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | undefined | null) {
  if (value === undefined || value === null) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number | undefined | null) {
  if (value === undefined || value === null) return '0';
  return new Intl.NumberFormat('en-US').format(value);
}

export function calculateDistressScore(property: any) {
  let score = 0;
  const factors = [];

  const pctGood = property.dwelling?.pdf_pct_good;
  if (pctGood !== undefined) {
    if (pctGood < 50) {
      score += 3;
      factors.push('Poor condition (<50%)');
    } else if (pctGood >= 50 && pctGood <= 64) {
      score += 2;
      factors.push('Fair condition (50-64%)');
    } else if (pctGood >= 65 && pctGood <= 74) {
      score += 1;
      factors.push('Average condition (65-74%)');
    }
  }

  if (property.owner_absentee) {
    score += 2;
    factors.push('Absentee owner');
  }

  const year = property.year_built || property.dwelling?.pdf_year_built;
  if (year && year < 1970) {
    score += 1;
    factors.push('Aging property (Pre-1970)');
  }

  const quality = property.dwelling?.pdf_quality;
  if (quality === 'Poor') {
    score += 2;
    factors.push('Poor quality rating');
  } else if (quality === 'Fair') {
    score += 1;
    factors.push('Fair quality rating');
  }

  if (property.tax?.tax_is_delinquent) {
    score += 2;
    factors.push('Tax delinquent');
  }

  // Note: last valid sale > 15 years ago logic would need sales data
  // For now we'll skip that or use a placeholder if we don't have it in the main object
  
  return { score, factors };
}

export function getDistressLevel(score: number) {
  if (score >= 8) return { label: 'High', color: 'text-distress-red bg-distress-red/10 border-distress-red/20' };
  if (score >= 5) return { label: 'Elevated', color: 'text-accent-amber bg-accent-amber/10 border-accent-amber/20' };
  if (score >= 3) return { label: 'Moderate', color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' };
  return { label: 'Low', color: 'text-positive-green bg-positive-green/10 border-positive-green/20' };
}
