export interface IntroOffer {
	product_id: number;
	product_slug: string;
	currency_code: string;
	formatted_price: string;
	original_price: number;
	raw_price: number;
	discount_percentage: number;
	ineligible_reason: string[] | null;
	interval_unit: string;
	interval_count: number;
}
