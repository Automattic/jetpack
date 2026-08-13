import { toFileNode } from '../use-file-tree';
import type { WpcomFileNode } from '../../data/api/file-tree';

const file = ( overrides: Partial< WpcomFileNode > = {} ): WpcomFileNode => ( {
	type: 'file',
	manifest_path: 'f5:/wp-config.php',
	...overrides,
} );

describe( 'toFileNode', () => {
	test( 'converts a numeric period to an ISO lastModified', () => {
		const node = toFileNode( 'wp-config.php', file( { period: '1777035492' } ), '/' );

		expect( node ).toMatchObject( {
			type: 'file',
			name: 'wp-config.php',
			path: '/wp-config.php',
			lastModified: '2026-04-24T12:58:12.000Z',
			period: '1777035492',
		} );
	} );

	// `period` comes straight from a WPCOM manifest with nothing validating
	// it. Before the guard, a non-numeric value reached
	// `new Date( NaN ).toISOString()`, which throws `RangeError: Invalid time
	// value` — inside a `useMemo` on the render path with no error boundary
	// above it, so a single bad entry blanked the entire file browser.
	// Dropping one timestamp is the correct failure mode.
	test.each( [
		[ 'non-numeric', 'not-a-timestamp' ],
		[ 'empty string', '' ],
		[ 'whitespace', '   ' ],
	] )( 'omits lastModified rather than throwing on a %s period', ( _label, period ) => {
		let node;
		expect( () => {
			node = toFileNode( 'wp-config.php', file( { period } ), '/' );
		} ).not.toThrow();

		expect( node ).toMatchObject( { type: 'file', name: 'wp-config.php' } );
		expect( node ).not.toHaveProperty( 'lastModified', expect.anything() );
	} );

	test( 'omits lastModified when period is absent', () => {
		const node = toFileNode( 'wp-config.php', file(), '/' );

		expect( node ).toMatchObject( { type: 'file', lastModified: undefined } );
	} );

	test( 'treats has_children as the folder discriminator, not type', () => {
		// Inside /wp-content, WPCOM reports folders as type: 'file'.
		const node = toFileNode(
			'mu-plugins',
			file( { type: 'file', has_children: true } ),
			'/wp-content'
		);

		expect( node ).toMatchObject( {
			type: 'folder',
			name: 'mu-plugins',
			path: '/wp-content/mu-plugins',
		} );
	} );
} );
