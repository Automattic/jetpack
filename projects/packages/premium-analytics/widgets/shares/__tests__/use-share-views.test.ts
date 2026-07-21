/**
 * Internal dependencies
 */
import { buildShareViews } from '../use-share-views';

describe( 'buildShareViews', () => {
	it( 'sorts positive share counts and applies the max row limit', () => {
		expect(
			buildShareViews(
				{
					shares: 16,
					shares_facebook: 10,
					shares_twitter: 5,
					shares_linkedin: 1,
					shares_tumblr: 0,
				},
				2
			)
		).toEqual( [
			{ service: 'facebook', label: 'Facebook', value: 10 },
			{ service: 'twitter', label: 'Twitter', value: 5 },
		] );
	} );

	it( 'normalizes legacy Google+ share keys', () => {
		expect( buildShareViews( { 'shares_google-plus-1': 7 }, 10 ) ).toEqual( [
			{ service: 'google_plus', label: 'Google+', value: 7 },
		] );
	} );

	it( 'aggregates custom share button keys into one row', () => {
		expect(
			buildShareViews(
				{
					'shares_custom-1513105119': 3,
					'shares_custom-1513105120': 4,
					shares_facebook: 1,
				},
				10
			)
		).toEqual( [
			{ service: 'custom', label: 'Custom share buttons', value: 7 },
			{ service: 'facebook', label: 'Facebook', value: 1 },
		] );
	} );

	it( 'treats max 0 as all rows', () => {
		expect(
			buildShareViews(
				{
					shares_facebook: 2,
					shares_twitter: 1,
				},
				0
			)
		).toHaveLength( 2 );
	} );
} );
