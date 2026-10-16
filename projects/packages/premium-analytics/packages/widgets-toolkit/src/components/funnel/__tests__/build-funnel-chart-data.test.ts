/**
 * Internal dependencies
 */
import { buildFunnelChartData, type FunnelStepInput } from '../build-funnel-chart-data';

const STEPS: FunnelStepInput[] = [
	{ id: 'sessions', label: 'Sessions', value: 1250, previousValue: 1100 },
	{ id: 'cart', label: 'Cart', value: 310, previousValue: 260 },
	{ id: 'checkout', label: 'Checkout', value: 140, previousValue: 120 },
	{ id: 'purchase', label: 'Purchase', value: 60, previousValue: 45 },
];

describe( 'buildFunnelChartData', () => {
	it( 'rates every step as a share of the first and the whole as the last over the first', () => {
		const { chartSteps, rate, previousRate } = buildFunnelChartData( STEPS, {
			hasComparison: true,
		} );

		expect( chartSteps.map( step => Math.round( step.rate * 10 ) / 10 ) ).toEqual( [
			100, 24.8, 11.2, 4.8,
		] );
		expect( chartSteps.map( step => step.count ) ).toEqual( [ 1250, 310, 140, 60 ] );
		expect( rate ).toBe( 0.048 );
		expect( previousRate ).toBeCloseTo( 0.0409, 4 );
	} );

	it( 'leaves the previous rate out when the comparison is off', () => {
		expect( buildFunnelChartData( STEPS, { hasComparison: false } ).previousRate ).toBeNull();
	} );

	it( 'leaves the previous rate out when the comparison period has no first step', () => {
		const steps = STEPS.map( ( { id, label, value } ) => ( { id, label, value } ) );

		expect( buildFunnelChartData( steps, { hasComparison: true } ).previousRate ).toBeNull();
	} );

	it( 'reads an empty first step as nothing rather than dividing by it', () => {
		const { chartSteps, rate } = buildFunnelChartData(
			[
				{ id: 'sessions', label: 'Sessions', value: 0 },
				{ id: 'purchase', label: 'Purchase', value: 0 },
			],
			{ hasComparison: false }
		);

		expect( chartSteps.map( step => step.rate ) ).toEqual( [ 0, 0 ] );
		expect( rate ).toBe( 0 );
	} );
} );
