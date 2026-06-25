import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

// RSM-1629: every button and interactive accent in the Write editor should use
// the standard Dotcom/WordPress components accent token (the WordPress.com brand
// "Blueberry Blue" #3858e9) instead of the legacy wp-admin blue (#2171b1). This
// guards against any future change reintroducing the off-brand colors.
const css = readFileSync( fileURLToPath( new URL( '../style.css', import.meta.url ) ), 'utf8' );

describe( 'Write editor button/accent colors (RSM-1629)', () => {
	it( 'contains no legacy wp-admin blues (#2171b1 / #2271b1)', () => {
		assert.equal(
			css.includes( '#2171b1' ),
			false,
			'style.css still references the legacy accent #2171b1'
		);
		assert.equal(
			css.includes( '#2271b1' ),
			false,
			'style.css still references the legacy link blue #2271b1'
		);
	} );

	it( 'contains no legacy wp-admin blue hover (#1a5f99)', () => {
		assert.equal(
			css.includes( '#1a5f99' ),
			false,
			'style.css still references the legacy hover #1a5f99'
		);
	} );

	it( 'contains no raw rgba() washes built from the legacy blue (33, 113, 177)', () => {
		assert.equal(
			/rgba\(\s*33\s*,\s*113\s*,\s*177/.test( css ),
			false,
			'style.css still references rgba washes derived from #2171b1'
		);
	} );

	it( 'uses the WordPress components accent token for the primary button', () => {
		// .bw-btn-publish is the primary CTA (Publish / Insert image / Post-picker Go).
		const publishBlock = css.match( /\.bw-btn-publish\s*\{[^}]*\}/ );
		assert.ok( publishBlock, '.bw-btn-publish rule not found' );
		assert.match(
			publishBlock[ 0 ],
			/background:\s*var\(\s*--wp-components-color-accent/,
			'.bw-btn-publish does not use var(--wp-components-color-accent)'
		);
	} );

	it( 'tracks the accent token for translucent washes via color-mix', () => {
		// Selection highlight, image-overlay hovers, and upload-zone fills should
		// derive from the accent token rather than a hardcoded color.
		assert.match(
			css,
			/color-mix\(\s*in srgb,\s*var\(\s*--wp-components-color-accent/,
			'no color-mix() built from the accent token found'
		);
	} );
} );
