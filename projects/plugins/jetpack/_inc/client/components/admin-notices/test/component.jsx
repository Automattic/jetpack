import { render, screen } from '@testing-library/react';
import AdminNotices from '../index';

const privacyNotice =
	'<div id="message" class="jetpack-message jetpack-err">Is this site private?</div>';
const sslNotice =
	'<div id="jetpack-ssl-warning" class="error jp-identity-crisis">Outbound HTTPS not working</div>';
// Core's common.js moves `div.error` after the page's hidden `.wrap h1`.
const page = `${ privacyNotice }<div class="wrap hide-if-js"><h1>Settings</h1>${ sslNotice }</div>`;

/**
 * Print `#wpbody-content`, then mount the notices in the app container.
 *
 * @return {HTMLElement} The app container.
 */
function mountInPage() {
	document.head.innerHTML = '<style>.hide-if-js { display: none; }</style>';
	document.body.innerHTML = `<div id="wpbody-content">${ page }</div>`;
	const { container } = render(
		<div id="jp-plugin-container">
			<AdminNotices />
		</div>
	);
	return container;
}

describe( 'AdminNotices', () => {
	afterEach( () => {
		document.head.innerHTML = '';
	} );

	it( 'moves Jetpack notices into the app, even hidden ones', () => {
		const app = mountInPage();

		for ( const text of [ 'Is this site private?', 'Outbound HTTPS not working' ] ) {
			expect( app ).toContainElement( screen.getByText( text ) );
			expect( screen.getByText( text ) ).toBeVisible();
		}
	} );
} );
