export type MarketConfig = {
  id: string;
  titleKey: string;
  categoryKey: string;
  odds: number;
  closingAt: string;
  participants?: number;
};

export const HERO_MARKETS: MarketConfig[] = [
  {
    id: 'sol-200',
    titleKey: 'market.title.sol200',
    categoryKey: 'category.crypto',
    odds: 0.58,
    closingAt: '2025-10-02T23:59:59Z',
    participants: 268,
  },
  {
    id: 'eth-3500',
    titleKey: 'market.title.eth3500',
    categoryKey: 'category.crypto',
    odds: 0.44,
    closingAt: '2025-10-02T12:00:00Z',
    participants: 192,
  },
];

export const SECTION_MARKETS = {
  closingSoon: [
    {
      id: 'pyusd-volume',
      titleKey: 'market.title.pyusdVolume',
      categoryKey: 'category.onchain',
      odds: 0.52,
      participants: 214,
      closingAt: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      id: 'meme-top10',
      titleKey: 'market.title.memeTop10',
      categoryKey: 'category.meme',
      odds: 0.63,
      participants: 152,
      closingAt: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString(),
    },
  ],
  trending: [
    {
      id: 'sol-ecosystem',
      titleKey: 'market.title.solEcosystem',
      categoryKey: 'category.ecosystem',
      odds: 0.41,
      participants: 384,
      closingAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    },
    {
      id: 'pyusd-fee',
      titleKey: 'market.title.pyusdFee',
      categoryKey: 'category.governance',
      odds: 0.28,
      participants: 95,
      closingAt: new Date(Date.now() + 1000 * 60 * 60 * 36).toISOString(),
    },
  ],
} as const;

export const ALL_MARKETS = [...HERO_MARKETS, ...SECTION_MARKETS.closingSoon, ...SECTION_MARKETS.trending];
