require( '../../src/js/menu-badges.js' );

/**
 * Build the markup for a single menu-counter badge, matching Menu_Renderer's output.
 *
 * @param {string}  slug    - The menu slug, i.e. `data-jp-menu-badge`.
 * @param {number}  count   - The badge's count.
 * @param {boolean} isTotal - Whether this is the top-level total badge.
 * @return {string} The badge's HTML markup.
 */
function badge( slug, count, isTotal ) {
	const hidden = count > 0 ? '' : ' style="display:none"';
	const classes = isTotal ? 'awaiting-mod update-plugins menu-counter' : 'menu-counter';
	return `<span class="${ classes } count-${ count }" data-jp-menu-badge="${ slug }" data-jp-menu-count="${ count }"${
		isTotal ? ' data-jp-menu-badge-total="1"' : ''
	}${ hidden }><span class="count">${ count }</span></span>`;
}

describe( 'jetpackMenuBadges.setCount', () => {
	beforeEach( () => {
		document.body.innerHTML =
			`<div id="forms">${ badge( 'jetpack-forms-responses-wp-admin', 15 ) }</div>` +
			`<div id="protect">${ badge( 'jetpack-protect', 1 ) }</div>` +
			`<div id="total">${ badge( 'total', 16, true ) }</div>`;
	} );

	it( 'updates the target badge and recomputes the total', () => {
		window.jetpackMenuBadges.setCount( 'jetpack-forms-responses-wp-admin', 14 );

		const forms = document.querySelector(
			'[data-jp-menu-badge="jetpack-forms-responses-wp-admin"]'
		);
		const total = document.querySelector( '[data-jp-menu-badge-total="1"]' );
		expect( forms ).toHaveAttribute( 'data-jp-menu-count', '14' );
		expect( forms.querySelector( '.count' ) ).toHaveTextContent( '14' );
		expect( total.querySelector( '.count' ) ).toHaveTextContent( '15' ); // 14 + 1
	} );

	it( 'clears a badge number at zero and drops it from the total', () => {
		window.jetpackMenuBadges.setCount( 'jetpack-forms-responses-wp-admin', 0 );

		const total = document.querySelector( '[data-jp-menu-badge-total="1"]' );
		expect( total.querySelector( '.count' ) ).toHaveTextContent( '1' ); // just protect
	} );
} );

describe( 'jetpackMenuBadges.setCount reveals and hides zero-count badges', () => {
	beforeEach( () => {
		// Forms and the total start at 0, so they ship hidden from the server.
		document.body.innerHTML =
			`<div id="forms">${ badge( 'jetpack-forms-responses-wp-admin', 0 ) }</div>` +
			`<div id="total">${ badge( 'total', 0, true ) }</div>`;
	} );

	it( 'reveals a hidden zero badge and its total when the count becomes positive', () => {
		const forms = document.querySelector(
			'[data-jp-menu-badge="jetpack-forms-responses-wp-admin"]'
		);
		const total = document.querySelector( '[data-jp-menu-badge-total="1"]' );
		expect( forms ).toHaveStyle( 'display: none' );

		window.jetpackMenuBadges.setCount( 'jetpack-forms-responses-wp-admin', 2 );

		expect( forms ).toHaveAttribute( 'data-jp-menu-count', '2' );
		expect( forms ).not.toHaveStyle( 'display: none' );
		expect( total ).not.toHaveStyle( 'display: none' );
		expect( total.querySelector( '.count' ) ).toHaveTextContent( '2' );
	} );

	it( 'hides a badge and total again when the count returns to zero', () => {
		window.jetpackMenuBadges.setCount( 'jetpack-forms-responses-wp-admin', 2 );
		window.jetpackMenuBadges.setCount( 'jetpack-forms-responses-wp-admin', 0 );

		const forms = document.querySelector(
			'[data-jp-menu-badge="jetpack-forms-responses-wp-admin"]'
		);
		const total = document.querySelector( '[data-jp-menu-badge-total="1"]' );
		expect( forms ).toHaveStyle( 'display: none' );
		expect( total ).toHaveStyle( 'display: none' );
	} );
} );

describe( 'jetpackMenuBadges.setCount with a cloned flyout-header total badge', () => {
	beforeEach( () => {
		// WordPress clones the top-level menu title (badge included) into a
		// `li.wp-submenu-head` flyout header, so two elements can carry
		// data-jp-menu-badge-total="1" at once.
		document.body.innerHTML =
			`<div id="forms">${ badge( 'jetpack-forms-responses-wp-admin', 15 ) }</div>` +
			`<div id="protect">${ badge( 'jetpack-protect', 1 ) }</div>` +
			`<li id="toplevel_page_jetpack">${ badge( 'total', 16, true ) }</li>` +
			`<li class="wp-submenu-head">${ badge( 'total', 16, true ) }</li>`;
	} );

	it( 'updates every total-badge clone, not just the first', () => {
		window.jetpackMenuBadges.setCount( 'jetpack-forms-responses-wp-admin', 14 );

		const totals = document.querySelectorAll( '[data-jp-menu-badge-total="1"]' );
		expect( totals ).toHaveLength( 2 );
		totals.forEach( totalEl => {
			expect( totalEl ).toHaveAttribute( 'data-jp-menu-count', '15' );
			expect( totalEl.querySelector( '.count' ) ).toHaveTextContent( '15' ); // 14 + 1
		} );
	} );
} );
