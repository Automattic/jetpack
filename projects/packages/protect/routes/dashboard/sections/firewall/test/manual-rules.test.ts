import { getManualRules, summarizeIpList } from '../manual-rules';

describe( 'summarizeIpList', () => {
	it.each( [
		[ 'an empty list', '', { shown: [], more: 0 } ],
		[
			'commas, spaces and new lines all separate',
			'1.1.1.1, 2.2.2.2\n3.3.3.3',
			{ shown: [ '1.1.1.1', '2.2.2.2', '3.3.3.3' ], more: 0 },
		],
		[
			'past three, the rest are counted',
			'1.1.1.1 2.2.2.2 3.3.3.3 4.4.4.4 10.0.0.0/8',
			{ shown: [ '1.1.1.1', '2.2.2.2', '3.3.3.3' ], more: 2 },
		],
		[ 'a missing setting is empty', undefined, { shown: [], more: 0 } ],
	] )( '%s', ( _name, list, expected ) => {
		expect( summarizeIpList( list ) ).toEqual( expected );
	} );
} );

describe( 'getManualRules', () => {
	const fromPageLoad = {
		blockList: '1.1.1.1',
		blockListEnabled: true,
		allowList: '',
		allowListEnabled: false,
	};

	it( 'uses the page-load rules until settings load', () => {
		expect( getManualRules( fromPageLoad, null ) ).toEqual( fromPageLoad );
	} );

	it( 'follows saved settings once they load', () => {
		expect(
			getManualRules( fromPageLoad, {
				jetpack_waf_ip_block_list: '2.2.2.2',
				jetpack_waf_ip_block_list_enabled: true,
				jetpack_waf_ip_allow_list: '3.3.3.3',
				jetpack_waf_ip_allow_list_enabled: true,
			} )
		).toEqual( {
			blockList: '2.2.2.2',
			blockListEnabled: true,
			allowList: '3.3.3.3',
			allowListEnabled: true,
		} );
	} );
} );
