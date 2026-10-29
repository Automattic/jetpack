/**
 * Internal dependencies
 */
import { getUtmUrlBuilderValues } from '../url-builder-values';

describe( 'getUtmUrlBuilderValues', () => {
	it.each( [
		[
			'maps a full action',
			[
				{
					type: 'url-builder',
					data: { url: 'https://example.com/p', utm_source: 'google', utm_medium: 'cpc' },
				},
			],
			{ destination: 'https://example.com/p', source: 'google', medium: 'cpc' },
		],
		[
			'maps a campaign-only action',
			[ { type: 'url-builder', data: { url: 'https://example.com/p', utm_campaign: 'spring' } } ],
			{ destination: 'https://example.com/p', campaign: 'spring' },
		],
		[
			'omits an unsafe destination',
			[ { type: 'url-builder', data: { url: 'javascript:alert(1)', utm_source: 'x' } } ],
			{ source: 'x' },
		],
		[
			'ignores non-string values',
			[ { type: 'url-builder', data: { url: 'https://example.com/p', utm_source: 5 } } ],
			{ destination: 'https://example.com/p' },
		],
		[
			'returns null without a url-builder action',
			[ { type: 'link', data: 'https://example.com' } ],
			null,
		],
		[ 'returns null for non-object data', [ { type: 'url-builder', data: 'nope' } ], null ],
		[ 'returns null for array data', [ { type: 'url-builder', data: [ 'x' ] } ], null ],
		[
			'returns null for an unsafe url and no UTM keys',
			[ { type: 'url-builder', data: { url: 'javascript:alert(1)' } } ],
			null,
		],
		[ 'returns null without actions', undefined, null ],
	] )( '%s', ( _name, actions, expected ) => {
		expect( getUtmUrlBuilderValues( actions ) ).toEqual( expected );
	} );
} );
