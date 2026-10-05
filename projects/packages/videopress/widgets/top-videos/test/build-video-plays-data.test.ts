import { toVideoPlaysRows } from '../build-video-plays-data';
import { getVideoKey, getVideoLabel } from '../video-plays';

const video = ( fields: Record< string, unknown > ) => ( {
	id: undefined,
	label: '',
	link: null,
	plays: 0,
	impressions: 0,
	watchTime: 0,
	retentionRate: 0,
	...fields,
} );

describe( 'toVideoPlaysRows', () => {
	it( 'carries the id, key, label, link and both play counts of a matched row', () => {
		expect(
			toVideoPlaysRows( [
				video( {
					id: 101,
					label: 'Walkthrough',
					link: 'https://example.com/a/',
					plays: 100,
					previousPlays: 80,
				} ),
			] )
		).toEqual( [
			{
				id: 101,
				key: '101',
				label: 'Walkthrough',
				link: 'https://example.com/a/',
				plays: 100,
				previousPlays: 80,
			},
		] );
	} );

	it( 'keeps previousPlays undefined, not zero, when the row has no comparison match', () => {
		const [ row ] = toVideoPlaysRows( [ video( { id: 101, label: 'Walkthrough', plays: 100 } ) ] );

		expect( row.previousPlays ).toBeUndefined();
	} );

	it( 'treats a real comparison value of zero as data, not as missing', () => {
		const [ row ] = toVideoPlaysRows( [
			video( { id: 101, label: 'Walkthrough', plays: 100, previousPlays: 0 } ),
		] );

		expect( row.previousPlays ).toBe( 0 );
	} );

	it( 'falls back to an untitled label and drops an id that is not a positive integer', () => {
		expect(
			toVideoPlaysRows( [ video( { id: 0, link: 'https://example.com/video/0/', plays: 10 } ) ] )
		).toEqual( [
			{
				key: '0',
				label: 'Untitled video',
				link: 'https://example.com/video/0/',
				plays: 10,
				previousPlays: undefined,
			},
		] );
	} );

	it( 'keys untitled videos without an id by their link so they do not collapse', () => {
		const rows = toVideoPlaysRows( [
			video( { link: 'https://example.com/video/1/', plays: 10 } ),
			video( { link: 'https://example.com/video/2/', plays: 5 } ),
		] );

		expect( rows.map( row => row.key ) ).toEqual( [
			'https://example.com/video/1/',
			'https://example.com/video/2/',
		] );
	} );
} );

describe( 'getVideoKey and getVideoLabel', () => {
	it( 'prefers the post id, then the link, then the label', () => {
		expect( getVideoKey( video( { id: 7, link: 'https://example.com/', label: 'A' } ) ) ).toBe(
			'7'
		);
		expect( getVideoKey( video( { link: 'https://example.com/', label: 'A' } ) ) ).toBe(
			'https://example.com/'
		);
		expect( getVideoKey( video( { label: 'A' } ) ) ).toBe( 'A' );
		expect( getVideoKey( video( {} ) ) ).toBe( 'Untitled video' );
	} );

	it( 'labels a video without a title as untitled', () => {
		expect( getVideoLabel( video( { label: 'Launch' } ) ) ).toBe( 'Launch' );
		expect( getVideoLabel( video( { label: '' } ) ) ).toBe( 'Untitled video' );
		expect( getVideoLabel( video( { label: null } ) ) ).toBe( 'Untitled video' );
	} );
} );
