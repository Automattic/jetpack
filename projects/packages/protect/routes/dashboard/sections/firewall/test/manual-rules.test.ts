import { summarizeIpList } from '../manual-rules';

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
