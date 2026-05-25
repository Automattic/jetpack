/**
 * Canvas-preview helper for jetpack-search/filter-post-type.
 *
 * The slug/label algorithmic surface lives in the shared post-type control
 * (`post-type-control.test.js`); this file covers the block's own
 * frontend-invisible canvas preview copy.
 */
import { describePreview } from '../../../src/search-blocks/blocks/filter-post-type/edit';

describe( 'describePreview', () => {
	const labelBySlug = new Map( [
		[ 'post', 'Post' ],
		[ 'page', 'Page' ],
		[ 'product', 'Product' ],
	] );

	it( 'renders the Exclude label and value when mode is exclude', () => {
		expect( describePreview( 'exclude', [ 'product' ], labelBySlug ) ).toEqual( {
			label: 'Exclude:',
			value: 'Product',
		} );
	} );

	it( 'renders the Include label and value when mode is include', () => {
		expect( describePreview( 'include', [ 'post', 'page' ], labelBySlug ) ).toEqual( {
			label: 'Include only:',
			value: 'Post, Page',
		} );
	} );

	it( 'shows "(none selected)" when no post types are configured (Exclude mode)', () => {
		expect( describePreview( 'exclude', [], labelBySlug ) ).toEqual( {
			label: 'Exclude:',
			value: '(none selected)',
		} );
	} );

	it( 'shows "(none selected)" when no post types are configured (Include mode)', () => {
		expect( describePreview( 'include', [], labelBySlug ) ).toEqual( {
			label: 'Include only:',
			value: '(none selected)',
		} );
	} );

	it( 'falls back to the raw slug when the type is not yet loaded', () => {
		// Simulates the brief window before core-data resolves `getPostTypes()`
		// — the picker shows raw slugs as token titles, and the preview should
		// match.
		expect( describePreview( 'exclude', [ 'unknown-cpt' ], new Map() ) ).toEqual( {
			label: 'Exclude:',
			value: 'unknown-cpt',
		} );
	} );
} );
