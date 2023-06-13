import { SVG, G } from '@wordpress/components';
import PaidSymbol from '../paid-symbol';
import renderPaidIcon from '../render-paid-icon';

const iconWithSrc = {
	src: (
		<SVG xmlns="http://www.w3.org/2000/svg">
			<G />
		</SVG>
	),
	foreground: '#50575e',
};

const iconWithSrcWithPaidIcon = {
	src: (
		<SVG xmlns="http://www.w3.org/2000/svg">
			<G />
			<PaidSymbol key="paid-symbol" />
		</SVG>
	),
	foreground: '#50575e',
};

const iconWithouthSrc = (
	<SVG xmlns="http://www.w3.org/2000/svg">
		<G />
	</SVG>
);

const iconWithouthSrcWithPaidIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg">
		<G />
		<PaidSymbol key="paid-symbol" />
	</SVG>
);

describe( 'renderPaidIcon enhance the default block icon', () => {
	it( 'when icon has src', () => {
		expect( renderPaidIcon( iconWithSrc ) ).toEqual( iconWithSrcWithPaidIcon );
	} );

	it( 'when icon does not have src', () => {
		expect( renderPaidIcon( iconWithouthSrc ) ).toEqual( iconWithouthSrcWithPaidIcon );
	} );
} );
