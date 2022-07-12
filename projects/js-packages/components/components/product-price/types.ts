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
};

export type PriceProps = {
	/**
	 * Price valuerice.
	 */
	value: number;

	/**
	 * Price current code.
	 */
	currency: string;

	/**
	 * True when it is an off price.
	 */
	isOff: boolean;
};
