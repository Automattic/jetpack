import { getClickCsvGroup } from '../clicks';
import type { ClickRow } from '../clicks';

describe( 'getClickCsvGroup', () => {
	it.each( [
		[
			'flat single-URL group',
			{
				id: 'jetpack.com|https://jetpack.com/features',
				clickedUrl: 'https://jetpack.com/features',
				href: 'https://jetpack.com/features',
				clicks: 12,
			},
			'jetpack.com',
		],
		[
			'nested leaf',
			{
				id: 'wordpress.org|https://wordpress.org/plugins/jetpack',
				parentId: 'wordpress.org',
				clickedUrl: 'https://wordpress.org/plugins/jetpack',
				href: 'https://wordpress.org/plugins/jetpack',
				clicks: 8,
			},
			'wordpress.org',
		],
	] )( 'returns the group for a %s', ( _label, row, expectedGroup ) => {
		expect( getClickCsvGroup( row as ClickRow ) ).toBe( expectedGroup );
	} );
} );
