/**
 * External dependencies
 */
import type { ReactNode } from 'react';

export type PricingCardProps = {
	/**
	 * The Title.
	 */
	title: string;
	/**
	 * The Icon.
	 */
	icon?: string | ReactNode;
	/**
	 * Price before discount.
	 */
	priceBefore: number;
	/**
	 * Price after discount.
	 */
	priceAfter: number;
	/**
	 * Price details.
	 */
	priceDetails?: string;
	/**
	 * The Currency code, eg 'USD'.
	 */
	currencyCode?: string;
	/**
	 * The CTA copy.
	 */
	ctaText?: string;
	/**
	 * The CTA callback to be called on click.
	 */
	onCtaClick?: React.MouseEventHandler< HTMLButtonElement >;
	/**
	 * Optional informative text.
	 */
	infoText?: ReactNode;
	/**
	 * The TOS copy.
	 */
	tosText?: ReactNode;
	/**
	 * Optional Child nodes
	 */
	children?: ReactNode;
};
