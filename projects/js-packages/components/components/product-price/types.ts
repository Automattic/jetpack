import type { ReactNode } from 'react';

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
	children?: ReactNode;

	/**
	 * Component variant
	 */
	variant?: 'default' | 'simple';
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

	/**
	 * Inline layout - symbol same size and positioned inline with the number.
	 */
	inline?: boolean;
};
