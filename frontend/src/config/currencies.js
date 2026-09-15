// Multi-Currency Pricing Configuration with Country Auto-Detection

export const CURRENCIES = {
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'India',
    flag: '🇮🇳',
    label: 'INR (₹)',
    prices: {
      free: '₹0',
      basic: '₹2,499',
      premium: '₹6,499',
      pro: '₹15,999'
    },
    amounts: {
      free: 0,
      basic: 2499,
      premium: 6499,
      pro: 15999
    }
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'United States',
    flag: '🇺🇸',
    label: 'USD ($)',
    prices: {
      free: '$0',
      basic: '$29',
      premium: '$79',
      pro: '$199'
    },
    amounts: {
      free: 0,
      basic: 29,
      premium: 79,
      pro: 199
    }
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Europe',
    flag: '🇪🇺',
    label: 'EUR (€)',
    prices: {
      free: '€0',
      basic: '€27',
      premium: '€74',
      pro: '€185'
    },
    amounts: {
      free: 0,
      basic: 27,
      premium: 74,
      pro: 185
    }
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'United Kingdom',
    flag: '🇬🇧',
    label: 'GBP (£)',
    prices: {
      free: '£0',
      basic: '£24',
      premium: '£62',
      pro: '£159'
    },
    amounts: {
      free: 0,
      basic: 24,
      premium: 62,
      pro: 159
    }
  },
  CAD: {
    code: 'CAD',
    symbol: 'CA$',
    name: 'Canada',
    flag: '🇨🇦',
    label: 'CAD (CA$)',
    prices: {
      free: 'CA$0',
      basic: 'CA$39',
      premium: 'CA$99',
      pro: 'CA$249'
    },
    amounts: {
      free: 0,
      basic: 39,
      premium: 99,
      pro: 249
    }
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australia',
    flag: '🇦🇺',
    label: 'AUD (A$)',
    prices: {
      free: 'A$0',
      basic: 'A$44',
      premium: 'A$119',
      pro: 'A$299'
    },
    amounts: {
      free: 0,
      basic: 44,
      premium: 119,
      pro: 299
    }
  }
};

export const CURRENCY_STORAGE_KEY = 'talentai_currency';

/**
 * Automatically detects the default currency based on the user's browser
 * timezone and language settings, defaulting to USD if no match.
 */
export function detectDefaultCurrency() {
  try {
    const saved = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (saved && CURRENCIES[saved]) {
      return saved;
    }

    const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || '').toLowerCase();
    const lang = (navigator.language || '').toLowerCase();
    const userLocales = (navigator.languages || []).map((l) => l.toLowerCase()).join(' ');

    if (
      tz.includes('calcutta') ||
      tz.includes('kolkata') ||
      lang.includes('-in') ||
      lang === 'hi' ||
      userLocales.includes('-in')
    ) {
      return 'INR';
    }

    if (tz.includes('london') || lang.includes('-gb') || lang.includes('-uk')) {
      return 'GBP';
    }

    if (
      tz.includes('toronto') ||
      tz.includes('vancouver') ||
      tz.includes('montreal') ||
      lang.includes('-ca')
    ) {
      return 'CAD';
    }

    if (
      tz.includes('sydney') ||
      tz.includes('melbourne') ||
      tz.includes('brisbane') ||
      lang.includes('-au')
    ) {
      return 'AUD';
    }

    if (
      tz.includes('paris') ||
      tz.includes('berlin') ||
      tz.includes('rome') ||
      tz.includes('madrid') ||
      tz.includes('amsterdam') ||
      tz.includes('brussels') ||
      tz.includes('europe') ||
      lang.includes('-de') ||
      lang.includes('-fr') ||
      lang.includes('-es') ||
      lang.includes('-it') ||
      lang.includes('-nl')
    ) {
      return 'EUR';
    }
  } catch (_) {}

  return 'USD';
}

/**
 * Format plan price given plan key, currency code, and billing cycle.
 */
export function formatPlanPrice(planKey, currencyCode = 'USD', billingCycle = 'monthly') {
  const curr = CURRENCIES[currencyCode] || CURRENCIES.USD;
  const baseAmount = curr.amounts[planKey] ?? 0;

  if (baseAmount === 0) {
    return `${curr.symbol}0`;
  }

  if (billingCycle === 'yearly') {
    const yearlyAnnualized = Math.round(baseAmount * 12 * 0.8);
    return `${curr.symbol}${yearlyAnnualized.toLocaleString()}`;
  }

  return `${curr.symbol}${baseAmount.toLocaleString()}`;
}
