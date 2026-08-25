/**
 * Internal dependencies
 */
import { resolveSeriesNames } from './resolve-series-names';
import type { ComparativeLineChartSeries } from '../components/chart-comparative-line/types';

const JULY_1 = new Date( '2026-07-01T00:00:00Z' );

/**
 * A series with a single point, since only labels and groups are read here.
 *
 * @param label   - The series label.
 * @param group   - Its group, when it belongs to one.
 * @param options - Its options, e.g. `{ type: 'comparison' }`.
 * @return The series.
 */
function series(
	label: string,
	group?: string,
	options?: ComparativeLineChartSeries[ 'options' ]
): ComparativeLineChartSeries {
	return { label, group, options, data: [ { date: JULY_1, value: 1 } ] };
}

describe( 'resolveSeriesNames', () => {
	it( 'names a comparison row after its group current period', () => {
		const { seriesNames } = resolveSeriesNames( [
			series( 'Views', 'views' ),
			series( 'Views · previous period', 'views', { type: 'comparison' } ),
		] );

		expect( seriesNames.get( 'Views · previous period' ) ).toBe( 'Views' );
	} );

	it( 'keeps a group-less series under its own label', () => {
		const { seriesNames, primaryByGroup } = resolveSeriesNames( [ series( 'Views' ) ] );

		expect( seriesNames.get( 'Views' ) ).toBe( 'Views' );
		expect( primaryByGroup.size ).toBe( 0 );
	} );

	it( 'maps each group to its first current-period label', () => {
		const { primaryByGroup } = resolveSeriesNames( [
			series( 'Views', 'views' ),
			series( 'Views · previous period', 'views', { type: 'comparison' } ),
			series( 'Visitors', 'visitors' ),
			series( 'Visitors · previous period', 'visitors', { type: 'comparison' } ),
		] );

		expect( Object.fromEntries( primaryByGroup ) ).toEqual( {
			views: 'Views',
			visitors: 'Visitors',
		} );
	} );

	it( 'is not paired when a single metric carries a previous period', () => {
		const { isPaired } = resolveSeriesNames( [
			series( 'Views', 'views' ),
			series( 'Views · previous period', 'views', { type: 'comparison' } ),
		] );

		expect( isPaired ).toBe( false );
	} );

	it( 'is paired as soon as a second metric arrives, visible or not', () => {
		// The counterpart ships seeded hidden, so this counts what the chart was
		// handed rather than what it currently draws.
		const { isPaired } = resolveSeriesNames( [
			series( 'Views', 'views' ),
			series( 'Visitors', 'visitors' ),
		] );

		expect( isPaired ).toBe( true );
	} );

	it( 'counts group-less metrics too, as the performance chart draws them', () => {
		const { isPaired, seriesNames } = resolveSeriesNames( [
			series( 'Views' ),
			series( 'Visitors' ),
			series( 'Likes' ),
		] );

		expect( isPaired ).toBe( true );
		expect( seriesNames.get( 'Likes' ) ).toBe( 'Likes' );
	} );

	it( 'handles an empty series list', () => {
		expect( resolveSeriesNames( [] ) ).toEqual( {
			primaryByGroup: new Map(),
			seriesNames: new Map(),
			isPaired: false,
		} );
	} );
} );
