import { render, screen } from '@testing-library/react';
import AdminNotices from '../index';

const privacyNotice =
	'<div id="message" class="jetpack-message jetpack-err">Is this site private?</div>';
const sslNotice =
	'<div id="jetpack-ssl-warning" class="error jp-identity-crisis">Outbound HTTPS not working</div>';

/**
 * Print `#wpbody-content`, then mount the notices in the app container.
 *
 * @param {string} html - `#wpbody-content` markup.
 * @return {HTMLElement} The app container.
 */
function mountInPage( html ) {
	document.body.innerHTML = `<div id="wpbody-content">${ html }</div>`;
	const { container } = render( <AdminNotices /> );
	return container;
}

describe( 'AdminNotices', () => {
	afterEach( () => {
		document.head.innerHTML = '';
	} );

	it( 'leaves visible Jetpack notices above the app', () => {
		const app = mountInPage( privacyNotice + sslNotice );

		for ( const text of [ 'Is this site private?', 'Outbound HTTPS not working' ] ) {
			expect( app ).not.toContainElement( screen.getByText( text ) );
			expect( screen.getByText( text ) ).toBeVisible();
		}
	} );

	it( 'moves Jetpack notices the wp-build template hides into the app', () => {
		document.head.innerHTML = '<style>#wpbody-content > div { display: none; }</style>';
		// Core's common.js moves `div.error` after the template's hidden `.wrap h1`.
		const app = mountInPage(
			`${ privacyNotice }<div class="wrap hide-if-js"><h1>Settings</h1>${ sslNotice }</div>`
		);

		for ( const text of [ 'Is this site private?', 'Outbound HTTPS not working' ] ) {
			expect( app ).toContainElement( screen.getByText( text ) );
			expect( screen.getByText( text ) ).toBeVisible();
		}
	} );
} );
