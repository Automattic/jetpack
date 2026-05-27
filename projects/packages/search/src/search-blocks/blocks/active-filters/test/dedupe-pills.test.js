import { dedupePillsInUl } from '../lib';

/**
 * Build a `<ul>` populated with `<li>` children carrying optional `data-pill-id`.
 *
 * @param {Array<string|null>} pillIds - Pill ids for each <li>, or null to omit the attribute.
 * @return {HTMLUListElement} The constructed list.
 */
function makeUl( pillIds ) {
	const ul = document.createElement( 'ul' );
	for ( const id of pillIds ) {
		const li = document.createElement( 'li' );
		if ( id !== null ) {
			li.setAttribute( 'data-pill-id', id );
		}
		ul.appendChild( li );
	}
	return ul;
}

/**
 * Build minimal pill descriptors with just the `id` field — all reconcile cares about.
 *
 * @param {...string} ids - Pill ids to wrap as `{ id }` descriptors.
 * @return {Array<{id: string}>} Pill descriptor array.
 */
function pills( ...ids ) {
	return ids.map( id => ( { id } ) );
}

describe( 'dedupePillsInUl', () => {
	it( 'leaves a single-pill list untouched', () => {
		const ul = makeUl( [ 'category:development' ] );
		dedupePillsInUl( ul, pills( 'category:development' ) );
		expect( ul.children ).toHaveLength( 1 );
		expect( ul.children[ 0 ] ).toHaveAttribute( 'data-pill-id', 'category:development' );
	} );

	it( 'drops a duplicate <li> that shares a pill id with an earlier sibling', () => {
		const ul = makeUl( [ 'category:development', 'category:development' ] );
		dedupePillsInUl( ul, pills( 'category:development' ) );
		expect( ul.children ).toHaveLength( 1 );
		expect( ul.children[ 0 ] ).toHaveAttribute( 'data-pill-id', 'category:development' );
	} );

	it( 'keeps the first occurrence and drops every later duplicate', () => {
		const ul = makeUl( [ 'a', 'a', 'a', 'a' ] );
		const first = ul.children[ 0 ];
		dedupePillsInUl( ul, pills( 'a' ) );
		expect( ul.children ).toHaveLength( 1 );
		expect( ul.children[ 0 ] ).toBe( first );
	} );

	it( 'removes <li> whose pill id is no longer in activePills', () => {
		const ul = makeUl( [ 'category:development', 'category:design' ] );
		dedupePillsInUl( ul, pills( 'category:development' ) );
		expect( ul.children ).toHaveLength( 1 );
		expect( ul.children[ 0 ] ).toHaveAttribute( 'data-pill-id', 'category:development' );
	} );

	it( 'leaves children without data-pill-id alone (e.g. the data-wp-each <template>)', () => {
		const ul = makeUl( [ null, 'category:development' ] );
		dedupePillsInUl( ul, pills( 'category:development' ) );
		expect( ul.children ).toHaveLength( 2 );
		expect( ul.children[ 1 ] ).toHaveAttribute( 'data-pill-id', 'category:development' );
	} );

	it( 'skips the data-wp-each <template> source element', () => {
		const ul = document.createElement( 'ul' );
		ul.appendChild( document.createElement( 'template' ) );
		const li = document.createElement( 'li' );
		li.setAttribute( 'data-pill-id', 'category:development' );
		ul.appendChild( li );
		dedupePillsInUl( ul, pills( 'category:development' ) );
		expect( ul.children ).toHaveLength( 2 );
		expect( ul.children[ 0 ].tagName ).toBe( 'TEMPLATE' );
		expect( ul.children[ 1 ] ).toHaveAttribute( 'data-pill-id', 'category:development' );
	} );

	it( 'handles the popover bug scenario (two pills, one active filter)', () => {
		const ul = makeUl( [ 'category:development', 'category:development' ] );
		dedupePillsInUl( ul, pills( 'category:development' ) );
		expect( ul.children ).toHaveLength( 1 );
	} );

	it( 'keeps multiple distinct pills in their original order', () => {
		const ul = makeUl( [ 'a', 'b', 'c' ] );
		dedupePillsInUl( ul, pills( 'a', 'b', 'c' ) );
		expect( Array.from( ul.children, li => li.getAttribute( 'data-pill-id' ) ) ).toEqual( [
			'a',
			'b',
			'c',
		] );
	} );

	it( 'mixes dedup and stale removal in one pass', () => {
		const ul = makeUl( [ 'a', 'a', 'b', 'c', 'c', 'stale' ] );
		dedupePillsInUl( ul, pills( 'a', 'b', 'c' ) );
		expect( Array.from( ul.children, li => li.getAttribute( 'data-pill-id' ) ) ).toEqual( [
			'a',
			'b',
			'c',
		] );
	} );

	it( 'is a no-op when activePills is empty (clears all stale <li>)', () => {
		const ul = makeUl( [ 'a', 'b' ] );
		dedupePillsInUl( ul, [] );
		expect( ul.children ).toHaveLength( 0 );
	} );

	it( 'tolerates a null ul (defensive)', () => {
		expect( () => dedupePillsInUl( null, pills( 'a' ) ) ).not.toThrow();
	} );
} );
