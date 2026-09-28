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
	// it. `toISOString()` throws `RangeError: Invalid time value` on an
	// unrepresentable date, from inside a `useMemo` on the render path —
	// so a single bad entry takes the whole file browser down with it.
	// Dropping one timestamp is the correct failure mode.
	//
	// `out-of-range` is the case a `Number.isFinite` check on the parsed
	// number misses: it is a perfectly finite number, but `Date` is only
	// defined within ±8.64e15 ms, so a `period` that arrives in
	// milliseconds or microseconds is still unrepresentable.
	test.each( [
		[ 'non-numeric', 'not-a-timestamp' ],
		[ 'empty string', '' ],
		[ 'whitespace', '   ' ],
		[ 'out-of-range', '1777035492000000' ],
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

	// The display `path` is ours; `id` is upstream's, and it is the only
	// value a granular download can name an entry by. This transform used
	// to drop it from both branches, which left the file selection
	// unsendable however carefully the tree tracked it.
	test.each( [
		[ 'file', file( { id: 'ZjY6L2luZGV4LnBocA==' } ), 'ZjY6L2luZGV4LnBocA==' ],
		// A folder id: two entry ids joined on upstream's own separator,
		// not one value that contains a comma.
		[ 'folder', file( { type: 'dir', id: 'cjI6,ZjI6Lw==' } ), 'cjI6,ZjI6Lw==' ],
	] )( 'carries the ls entry id through for a %s', ( _label, raw, expected ) => {
		expect( toFileNode( 'index.php', raw as WpcomFileNode, '/' ) ).toMatchObject( {
			id: expected,
		} );
	} );
} );
