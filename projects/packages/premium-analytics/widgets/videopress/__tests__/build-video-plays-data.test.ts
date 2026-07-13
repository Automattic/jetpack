/**
 * Internal dependencies
 */
import { toVideoPlaysRows } from '../build-video-plays-data';
import type { StatsNormalizedReport, StatsVideoPlaysItem } from '@jetpack-premium-analytics/data';

const report = (
	items: Array< Partial< StatsVideoPlaysItem > >
): StatsNormalizedReport< StatsVideoPlaysItem > =>
	( {
		summary: {},
		data: [ { date: '2026-06-16', items } ],
	} ) as unknown as StatsNormalizedReport< StatsVideoPlaysItem >;

describe( 'toVideoPlaysRows', () => {
	it( 'matches comparison plays by stable video id, not by row order', () => {
		const rows = toVideoPlaysRows(
			report( [
				{ id: 101, label: 'Walkthrough', link: 'https://example.com/a/', plays: 100 },
				{ id: 102, label: 'Launch', link: 'https://example.com/b/', plays: 50 },
			] ),
			// Reversed order, and only one overlapping video.
			report( [ { id: 102, label: 'Launch', link: 'https://example.com/b/', plays: 80 } ] )
		);

		expect( rows ).toEqual( [
			expect.objectContaining( { key: '101', plays: 100, previousPlays: null } ),
			expect.objectContaining( { key: '102', plays: 50, previousPlays: 80 } ),
		] );
	} );

	it( 'keeps previousPlays null (not zero) for videos missing from the comparison period', () => {
		const rows = toVideoPlaysRows(
			report( [ { id: 101, label: 'Walkthrough', link: null, plays: 100 } ] ),
			report( [] )
		);

		expect( rows[ 0 ].previousPlays ).toBeNull();
	} );

	it( 'carries the video link and falls back to an untitled label', () => {
		const rows = toVideoPlaysRows(
			report( [ { id: 107, label: '', link: 'https://example.com/video/107/', plays: 10 } ] ),
			undefined
		);

		expect( rows[ 0 ] ).toEqual( {
			key: '107',
			label: 'Untitled video',
			link: 'https://example.com/video/107/',
			plays: 10,
			previousPlays: null,
		} );
	} );

	it( 'keys untitled videos without an id by their link so they do not collapse', () => {
		const rows = toVideoPlaysRows(
			report( [
				{ label: '', link: 'https://example.com/video/1/', plays: 10 },
				{ label: '', link: 'https://example.com/video/2/', plays: 5 },
			] ),
			undefined
		);

		expect( rows.map( row => row.key ) ).toEqual( [
			'https://example.com/video/1/',
			'https://example.com/video/2/',
		] );
	} );
} );
