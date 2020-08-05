/**
 * @jest-environment jsdom
 */

/**
 * WordPress dependencies
 */
import { SVG, G } from '@wordpress/components';

/**
 * Internal dependencies
 */
import renderPremiumIcon from '../render-premium-icon';
import PaidSymbol from '../paid-symbol';

const iconWithSrc = {
	src: (
		<SVG xmlns="http://www.w3.org/2000/svg">
			<G />
		</SVG>
	),
	foreground: '#555d66',
};

const iconWithSrcWithPremiumIcon = {
	src: (
		<SVG xmlns="http://www.w3.org/2000/svg">
			<G />
			<PaidSymbol />
		</SVG>
	),
	foreground: '#555d66',
};

const iconWithouthSrc = (
	<SVG xmlns="http://www.w3.org/2000/svg">
		<G />
	</SVG>
);

const iconWithouthSrcWithPremiumIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg">
		<G />
		<PaidSymbol />
	</SVG>
);

describe( 'renderPremiumIcon enhance the default block icon', () => {
	it( 'when icon has src', () => {
		expect( renderPremiumIcon( iconWithSrc ) ).toEqual( iconWithSrcWithPremiumIcon );
	} );

	it( 'when icon does not have src', () => {
		expect( renderPremiumIcon( iconWithouthSrc ) ).toEqual( iconWithouthSrcWithPremiumIcon );
	} );
} );
