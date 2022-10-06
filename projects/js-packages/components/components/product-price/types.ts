export type ProductPriceProps = {
	/**
	 * Product price.
	 */
	price?: number;

	/**
	 * Product price with discount.
	 */
	offPrice?: number;

	/**
	 * Product currency code.
	 */
	currency?: string;

	/**
	 * Product legend.
	 */
	legend?: string;

	/**
	 * Show the not off price.
	 */
	showNotOffPrice?: boolean;

	/**
	 * Force the price as a not off price.
	 */
	isNotConvenientPrice?: boolean;

	/**
	 * Hides the price fraction if fraction is zero.
	 */
	hidePriceFraction?: boolean;

	/**
	 * Hides discount label
	 */
	hideDiscountLabel?: boolean;

	/**
	 * Custom promo label
	 */
	promoLabel?: string;

	/**
	 * Alternative legend with HTML syntax
	 */
	children?: React.ReactNode;
};

export type PriceProps = {
	/**
	 * Price value.
	 */
	value: number;

	/**
	 * Price currency code.
	 */
	currency: string;

	/**
	 * True when it is an off price.
	 */
	isOff: boolean;

	/**
	 * Hides the price fraction if fraction is zero.
	 */
	hidePriceFraction?: boolean;
};
