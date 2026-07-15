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
			post: {
				id: 31533,
				title: 'Launch recap',
				date: '2026-06-12 14:30:00',
			},
		} );
	} );

	it( 'returns empty collections for an empty payload', () => {
		expect( sanitizeStatsSingleVideoResponse( singleVideoEmptyFixture ) ).toEqual( {
			data: [],
			pages: [],
			post: null,
		} );
	} );

	it( 'drops malformed rows and keeps only well-formed [ date, views ] tuples', () => {
		expect( sanitizeStatsSingleVideoResponse( undefined ) ).toEqual( {
			data: [],
			pages: [],
			post: null,
		} );
		expect(
			sanitizeStatsSingleVideoResponse( {
				data: [ 'not-a-row', [], [ 1, 2 ], [ '2026-06-12', 2 ] ],
				pages: [ 7 ],
				post: 'not-a-post',
			} )
		).toEqual( {
			data: [ { period: '2026-06-12', value: 2 } ],
			pages: [],
			post: null,
		} );
	} );

	it( 'keeps only well-formed attachment post fields', () => {
		expect(
			sanitizeStatsSingleVideoResponse( {
				post: { ID: '42', post_title: 'Demo', post_date: '2026-06-15 09:00:00' },
			} ).post
		).toEqual( {
			id: 42,
			title: 'Demo',
			date: '2026-06-15 09:00:00',
		} );

		expect(
			sanitizeStatsSingleVideoResponse( {
				post: { ID: -1, post_title: 7, post_date: false },
			} ).post
		).toEqual( {} );
	} );
} );
