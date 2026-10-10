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
 * @param {object} containerProps - Extra props for `#jp-plugin-container`.
 * @return {HTMLElement} The app container.
 */
function mountInPage( containerProps = {} ) {
	document.head.innerHTML = '<style>.hide-if-js { display: none; }</style>';
	document.body.innerHTML = `<div id="wpbody-content">${ page }</div>`;
	const { container } = render(
		<div id="jp-plugin-container" { ...containerProps }>
			<AdminNotices />
		</div>
	);
	return container;
}

describe( 'AdminNotices', () => {
	afterEach( () => {
		document.head.innerHTML = '';
	} );

	it( 'leaves Jetpack notices in place on the webpack page, even hidden ones', () => {
		const app = mountInPage();

		expect( app ).not.toContainElement( screen.getByText( 'Is this site private?' ) );
		expect( screen.getByText( 'Is this site private?' ) ).toBeVisible();
		expect( app ).not.toContainElement( screen.getByText( 'Outbound HTTPS not working' ) );
		expect( screen.getByText( 'Outbound HTTPS not working' ) ).not.toBeVisible();
	} );

	it( 'moves Jetpack notices into the app on the wp-build page', () => {
		const app = mountInPage( { 'data-wp-build': true } );

		for ( const text of [ 'Is this site private?', 'Outbound HTTPS not working' ] ) {
			expect( app ).toContainElement( screen.getByText( text ) );
			expect( screen.getByText( text ) ).toBeVisible();
		}
	} );
} );
