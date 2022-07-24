/**
 * External dependencies
 */
import type { Button } from '@wordpress/components';
import type React from 'react';

export type PricingCardProps = {
	/**
	 * The Title.
	 */
	title: string;
	/**
	 * The Icon.
	 */
	icon?: string;
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
	onCtaClick?: Button.ButtonProps[ 'onClick' ];
	/**
	 * Optional informative text.
	 */
	infoText?: React.ReactNode;
};
