/* eslint-disable react/react-in-jsx-scope */
/**
 * External dependencies
 */
import React from 'react';
import { action } from '@storybook/addon-actions';

/**
 * Internal dependencies
 */
import PricingCard from '../index.jsx';

export default {
	title: 'Playground/Pricing Card',
	component: PricingCard,
	// TODO: Storybook Actions are not working. See https://github.com/storybookjs/storybook/issues/7215
	argTypes: {
		onCtaClick: { action: 'clicked' },
	},
};

// Export additional stories using pre-defined values
const Template = args => <PricingCard { ...args } />;

const DefaultArgs = {
	title: 'Jetpack Backup',
	icon:
		"data:image/svg+xml,%3Csvg width='32' height='32' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cmask id='a' maskUnits='userSpaceOnUse' x='0' y='5' width='32' height='22'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M16 5.333c4.853 0 8.893 3.453 9.8 8.053 3.467.24 6.2 3.094 6.2 6.614a6.67 6.67 0 01-6.667 6.666H8c-4.413 0-8-3.586-8-8 0-4.12 3.12-7.52 7.133-7.946A9.994 9.994 0 0116 5.333zM8.667 18l4.666 4.666 8.787-8.786L20.24 12l-6.907 6.906-2.786-2.786L8.667 18z' fill='%23fff'%3E%3C/path%3E%3C/mask%3E%3Cg mask='url(%23a)'%3E%3Cpath fill='%23000' d='M0 0h32v32H0z'%3E%3C/path%3E%3C/g%3E%3C/svg%3E",
	priceBefore: '9',
	priceAfter: '4.50',
	ctaText: 'Get Jetpack Backup',
	infoText:
		'Special introductory pricing, all renewals are at full price. 14 day money back guarantee.',
	onCtaClick: action( 'onCtaClick' ),
};

// Export Default story using knobs
export const _default = Template.bind( {} );
_default.args = DefaultArgs;
