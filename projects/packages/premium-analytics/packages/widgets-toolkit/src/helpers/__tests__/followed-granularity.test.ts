/**
 * Internal dependencies
 */
import { followedGranularity } from '../followed-granularity';

const BUCKETS = [ 'hour', 'day', 'week', 'month' ] as const;

describe( 'followedGranularity', () => {
	it( 'follows the page when nobody has picked', () => {
		expect( followedGranularity( { interval: 'week', allowed: BUCKETS } ) ).toBe( 'week' );
	} );

	it( 'honours a pick made against the bucket the page still resolves to', () => {
		expect(
			followedGranularity( {
				picked: 'day',
				pickedFor: 'week',
				interval: 'week',
				allowed: BUCKETS,
			} )
		).toBe( 'day' );
	} );

	// The pick lapses on its own, so nothing has to notice the move and write the
	// attribute back — which is what keeps the chart and its control in step.
	it( 'drops a pick once the page resolves to another bucket', () => {
		expect(
			followedGranularity( {
				picked: 'day',
				pickedFor: 'week',
				interval: 'month',
				allowed: BUCKETS,
			} )
		).toBe( 'month' );
	} );

	// A pick recorded before the widget offered its current set — `auto`, say.
	it( 'drops a pick naming a bucket no longer offered', () => {
		expect(
			followedGranularity( {
				picked: 'auto',
				pickedFor: 'week',
				interval: 'week',
				allowed: BUCKETS,
			} )
		).toBe( 'week' );
	} );

	// A pick with no record of what it was made against cannot be shown to still
	// apply, so the page keeps the bucket.
	it( 'drops a pick that never recorded what it was made against', () => {
		expect( followedGranularity( { picked: 'day', interval: 'week', allowed: BUCKETS } ) ).toBe(
			'week'
		);
	} );

	// The page interval and the bucket are not the same vocabulary: `quarter` is
	// an interval the chart draws as months.
	it( 'clamps the page interval to a bucket the caller offers', () => {
		expect( followedGranularity( { interval: 'quarter', allowed: BUCKETS } ) ).toBe( 'month' );
	} );
} );
