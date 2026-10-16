import { render, screen } from '@testing-library/react';
import { StatsTierSlider } from '../stats-tier-slider';
import type { StatsUpgradeTier } from '@jetpack-premium-analytics/data';

const TIERS: StatsUpgradeTier[] = [
	{ views: 10000, price: 10000, upgradePrice: 0 },
	{ views: 100000, price: 20000, upgradePrice: 0 },
	{ views: 2000000, price: 95000, upgradePrice: 0, perUnitFee: 25000, extensionStep: 1000000 },
];

function renderSlider( value: number, tiers = TIERS ) {
	return render(
		<StatsTierSlider tiers={ tiers } currencyCode="USD" value={ value } onChange={ jest.fn() } />
	);
}

describe( 'StatsTierSlider', () => {
	it( 'shows the selected tier as views per month and its yearly price per month', () => {
		renderSlider( 1 );

		expect( screen.getByText( '100K' ) ).toBeInTheDocument();
		expect( screen.getByText( '$16.67' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'slider' ) ).toHaveAttribute(
			'aria-valuetext',
			'100K views per month, $16.67'
		);
	} );

	it( 'shows and announces what an upgrade costs, after the struck-through full price', () => {
		renderSlider( 0, [
			{ views: 250000, price: 30000, upgradePrice: 10000 },
			{ views: 500000, price: 50000, upgradePrice: 30000 },
		] );

		expect( screen.getByText( '$25' ).tagName ).toBe( 'S' );
		expect( screen.getByText( /\$8\.33/ ) ).toBeInTheDocument();
		expect( screen.getByRole( 'slider' ) ).toHaveAttribute(
			'aria-valuetext',
			'250K views per month, $8.33'
		);
	} );

	it( 'states the per-million fee only on the open-ended tier', () => {
		const { rerender } = renderSlider( 1 );
		expect( screen.queryByText( /per million views/ ) ).not.toBeInTheDocument();

		rerender(
			<StatsTierSlider tiers={ TIERS } currencyCode="USD" value={ 2 } onChange={ jest.fn() } />
		);
		expect(
			screen.getByText(
				'Beyond 1 million, we’ll charge an extra $20.83 per million views per month.'
			)
		).toBeInTheDocument();
	} );
} );
