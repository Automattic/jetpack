import { sanitizeStatsSingleVideoResponse } from '..';
import { singleVideoEmptyFixture, singleVideoFixture } from '../__fixtures__/single-video';

describe( 'Stats single video normalizer', () => {
	it( 'normalizes the views time series and embed pages', () => {
		const result = sanitizeStatsSingleVideoResponse( singleVideoFixture );

		expect( result ).toEqual( {
			data: [
				{ period: '2026-06-12', value: 1 },
				{ period: '2026-06-13', value: 4 },
				{ period: '2026-06-14', value: 0 },
			],
			pages: [
				{
					label: 'https://example.com/intro-video/',
					link: 'https://example.com/intro-video/',
				},
				{
					label: 'https://example.com/2026/06/launch-recap/',
					link: 'https://example.com/2026/06/launch-recap/',
				},
			],
		} );
	} );

	it( 'returns empty collections for an empty payload', () => {
		expect( sanitizeStatsSingleVideoResponse( singleVideoEmptyFixture ) ).toEqual( {
			data: [],
			pages: [],
		} );
	} );

	it( 'drops malformed rows and keeps only well-formed [ date, views ] tuples', () => {
		expect( sanitizeStatsSingleVideoResponse( undefined ) ).toEqual( { data: [], pages: [] } );
		expect(
			sanitizeStatsSingleVideoResponse( {
				data: [ 'not-a-row', [], [ 1, 2 ], [ '2026-06-12', 2 ] ],
				pages: [ 7 ],
			} )
		).toEqual( {
			data: [ { period: '2026-06-12', value: 2 } ],
			pages: [],
		} );
	} );
} );
