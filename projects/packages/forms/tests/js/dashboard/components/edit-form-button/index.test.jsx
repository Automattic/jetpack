/**
 * External dependencies
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/*
 * The config store resolver fetches `/wp/v2/feedback/config` as soon as a config
 * value is read. Hand it a promise that never settles so each test controls the
 * store state explicitly instead of racing the resolver.
 */
await jest.unstable_mockModule( '@wordpress/api-fetch', () => ( {
	default: jest.fn( () => new Promise( () => {} ) ),
} ) );

const { createRegistry, RegistryProvider } = await import( '@wordpress/data' );
const { store: configStore, CONFIG_STORE } = await import( '../../../../../src/store/config' );
const { default: EditFormButton } = await import(
	'../../../../../src/dashboard/components/edit-form-button'
);

const ADMIN_URL = 'https://example.com/wp-admin/';

describe( 'EditFormButton', () => {
	let registry;
	let wrapper;

	beforeEach( () => {
		registry = createRegistry();
		registry.register( configStore );

		wrapper = ( { children } ) => (
			<RegistryProvider value={ registry }>{ children }</RegistryProvider>
		);
	} );

	it( 'holds the slot with a non-navigable button while the admin URL is still loading', () => {
		render( <EditFormButton formId={ 42 } />, { wrapper } );

		// The control stays in the DOM so the header does not shift once config lands.
		expect( screen.getByRole( 'button', { name: 'Edit form' } ) ).toBeInTheDocument();

		// It must not be a link yet — an href built without adminUrl would be relative.
		expect( screen.queryByRole( 'link', { name: 'Edit form' } ) ).not.toBeInTheDocument();
	} );

	it( 'renders an absolute link once the admin URL resolves', () => {
		registry.dispatch( CONFIG_STORE ).receiveConfig( { adminUrl: ADMIN_URL } );

		render( <EditFormButton formId={ 42 } />, { wrapper } );

		const link = screen.getByRole( 'link', { name: 'Edit form' } );
		expect( link ).toHaveAttribute( 'href', `${ ADMIN_URL }post.php?post=42&action=edit` );
	} );

	it( 'falls back to a relative link when the config request fails, rather than staying disabled', () => {
		registry.dispatch( CONFIG_STORE ).setConfigError( 'Request failed' );

		render( <EditFormButton formId={ 42 } />, { wrapper } );

		// There is nothing left to wait for, so the action must stay usable.
		const link = screen.getByRole( 'link', { name: 'Edit form' } );
		expect( link ).toHaveAttribute( 'href', 'post.php?post=42&action=edit' );
	} );

	it( 'fires onClick when the resolved link is activated', async () => {
		const user = userEvent.setup();
		const onClick = jest.fn();
		registry.dispatch( CONFIG_STORE ).receiveConfig( { adminUrl: ADMIN_URL } );

		// It is a real anchor now, so let jsdom dispatch the click without
		// trying to follow the href (which it cannot do, and warns about).
		const preventNavigation = event => event.preventDefault();
		document.addEventListener( 'click', preventNavigation );

		try {
			render( <EditFormButton formId={ 42 } onClick={ onClick } />, { wrapper } );

			await user.click( screen.getByRole( 'link', { name: 'Edit form' } ) );
		} finally {
			document.removeEventListener( 'click', preventNavigation );
		}

		expect( onClick ).toHaveBeenCalledTimes( 1 );
	} );
} );
