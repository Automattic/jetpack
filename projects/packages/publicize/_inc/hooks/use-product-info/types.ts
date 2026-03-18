export type PriceData = {
	price: number;
	introOffer: number | null;
};

export type ProductInfo = {
	currencyCode: string;
	v1: PriceData;
};

export type PricingInfo = {
	full_price: number;
	currency_code?: string | null;
	introductory_offer?: {
		cost_per_interval: number;
	} | null;
};
