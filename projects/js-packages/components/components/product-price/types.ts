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
	 * Product leytend.
	 */
	leyend?: string;

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
	 * Promo label to show top right of the price.
	 */
	promoLabel?: string;

	/**
	 * Alternative leyend with HTML syntax
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
