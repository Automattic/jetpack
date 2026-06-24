import { readFileSync } from 'fs';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { act, render, screen, waitFor, within } from 'test/test-utils';
import { OfflineMode } from '../index';
import { offlineFeaturesResponse } from './fixtures';
jest.mock( '@wordpress/api-fetch', () => jest.fn() );

describe( 'OfflineMode', () => {
	beforeEach( () => {
		apiFetch.mockReset();
		apiFetch.mockResolvedValue( offlineFeaturesResponse );
	} );

	it( 'renders a focused Offline Mode screen with grouped feature toggles', async () => {
		render(
			<OfflineMode
				apiNonce="test-nonce"
				apiRoot="https://example.com/wp-json/"
				activateModule={ jest.fn() }
				deactivateModule={ jest.fn() }
				fetchModules={ jest.fn() }
			/>
		);

		await expect(
			screen.findByRole( 'heading', { name: 'Offline Mode' } )
		).resolves.toBeInTheDocument();
		expect( screen.queryByText( '2 offline-safe' ) ).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'heading', { name: 'Content and editor' } )
		).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'heading', { level: 2, name: 'Grow your audience' } )
		).toBeInTheDocument();
		expect( screen.getByRole( 'checkbox', { name: 'Forms' } ) ).toBeChecked();
		expect( screen.queryByRole( 'heading', { level: 2, name: 'Forms' } ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'checkbox', { name: 'Blocks' } ) ).not.toBeChecked();
		expect( screen.getByRole( 'checkbox', { name: 'Newsletter' } ) ).not.toBeChecked();
		expect( screen.queryByRole( 'heading', { name: 'Performance' } ) ).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'heading', { level: 2, name: 'Speed up your site' } )
		).toBeInTheDocument();
		expect( screen.getByRole( 'heading', { level: 3, name: 'Boost' } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'checkbox', { name: 'Boost' } ) ).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'heading', { name: 'Theme enhancements' } )
		).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'heading', { level: 2, name: 'Other features' } )
		).toBeInTheDocument();
		expect(
			screen.getAllByRole( 'heading', { level: 2 } ).map( heading => heading.textContent )
		).toEqual( [
			'Grow your audience',
			'Speed up your site',
			'Protect your site',
			'Other features',
		] );
		expect( screen.getByRole( 'heading', { level: 3, name: 'Theme tools' } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'checkbox', { name: 'Theme tools' } ) ).not.toBeInTheDocument();
		expect( screen.getAllByText( 'Always available' ) ).toHaveLength( 2 );
		expect( screen.getAllByText( 'Recommended' ) ).toHaveLength( 2 );
		expect( screen.getAllByText( 'Partial support' ) ).toHaveLength( 3 );
		expect(
			screen.getByText( 'Some blocks require a WordPress.com connection.' )
		).toBeInTheDocument();
		expect(
			screen.getAllByText( 'Email delivery still requires a connection.' ).length
		).toBeGreaterThan( 0 );
	} );

	it( 'renders the shared Jetpack admin footer in the fixed layout', async () => {
		render(
			<OfflineMode
				apiNonce="test-nonce"
				apiRoot="https://example.com/wp-json/"
				activateModule={ jest.fn() }
				deactivateModule={ jest.fn() }
				fetchModules={ jest.fn() }
			/>
		);

		await expect(
			screen.findByRole( 'heading', { name: 'Offline Mode' } )
		).resolves.toBeInTheDocument();
		expect( screen.getByRole( 'contentinfo', { name: 'Jetpack' } ) ).toHaveClass(
			'jetpack-footer'
		);
	} );

	it( 'uses the product page icon treatment for active badges', async () => {
		render(
			<OfflineMode
				activateModule={ jest.fn() }
				deactivateModule={ jest.fn() }
				fetchModules={ jest.fn() }
			/>
		);

		await expect( screen.findByRole( 'checkbox', { name: 'Forms' } ) ).resolves.toBeChecked();

		const activeBadge = screen.getAllByText( 'Active', {
			selector: '.jp-offline-mode__status-badge',
		} )[ 0 ];

		expect( activeBadge ).toBeInTheDocument();
		expect( activeBadge ).toHaveTextContent( 'Active' );

		const componentSource = readFileSync( `${ __dirname }/../component.jsx`, 'utf8' );

		expect( componentSource ).toContain( "import { Icon, published } from '@wordpress/icons';" );
		expect( componentSource ).toContain( 'icon={ published }' );
		expect( componentSource ).toContain( 'jp-offline-mode__status-badge-icon' );
		expect( componentSource ).not.toContain( "import Gridicon from 'components/gridicon';" );
	} );

	it( 'renders documentation links for offline features', async () => {
		render(
			<OfflineMode
				activateModule={ jest.fn() }
				deactivateModule={ jest.fn() }
				fetchModules={ jest.fn() }
			/>
		);

		await expect( screen.findByRole( 'checkbox', { name: 'Forms' } ) ).resolves.toBeChecked();

		const documentationLinks = screen.getAllByRole( 'link', { name: /documentation/ } );

		expect( documentationLinks ).toHaveLength( 5 );
		expect( screen.queryByText( 'View documentation' ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'View Forms documentation' } ) ).toHaveAttribute(
			'href',
			'https://jetpack.com/redirect/?source=jetpack-support-contact-form'
		);
		expect( screen.getByRole( 'link', { name: 'View Newsletter documentation' } ) ).toHaveAttribute(
			'href',
			'https://jetpack.com/redirect/?url=https%3A%2F%2Fjetpack.com%2Fsupport%2Fnewsletter'
		);
	} );

	it( 'renders limitation notices as row-level content for wider layout', async () => {
		render(
			<OfflineMode
				activateModule={ jest.fn() }
				deactivateModule={ jest.fn() }
				fetchModules={ jest.fn() }
			/>
		);

		const limitationNotice = await screen.findByRole( 'note', {
			name: 'Newsletter limitation',
		} );

		expect( limitationNotice ).toHaveClass( 'jp-offline-mode__limitation' );
		expect( limitationNotice ).toHaveTextContent( 'Email delivery still requires a connection.' );
	} );

	it( 'uses the modern wp-build admin page layout', () => {
		const offlineModeStyles = readFileSync( `${ __dirname }/../style.scss`, 'utf8' );

		expect( offlineModeStyles ).toContain( '@include jetpack-admin-page-layout-wp-build;' );
		expect( offlineModeStyles ).toContain( 'padding-block-start: 24px;' );
		expect( offlineModeStyles ).not.toContain( 'boot-layout' );
		expect( offlineModeStyles ).not.toContain( '#wpwrap' );
	} );

	it( 'hands legacy Offline Mode hash routes off to the boot-backed admin page', () => {
		const mainSource = readFileSync( `${ __dirname }/../../main.jsx`, 'utf8' );

		expect( mainSource ).toContain( 'admin.php?page=jetpack-offline-mode' );
		expect( mainSource ).not.toContain( '<OfflineMode' );
	} );

	it( 'renders connection-required features in product groups', async () => {
		render(
			<OfflineMode
				activateModule={ jest.fn() }
				deactivateModule={ jest.fn() }
				fetchModules={ jest.fn() }
			/>
		);

		await expect(
			screen.findByRole( 'heading', { name: 'Protect your site' } )
		).resolves.toBeInTheDocument();
		expect(
			screen.queryByRole( 'heading', { name: 'Requires connection' } )
		).not.toBeInTheDocument();
		expect( screen.getByText( 'Jetpack AI' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Jetpack Comments' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Jetpack Scan' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'checkbox', { name: 'Jetpack AI' } ) ).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'checkbox', { name: 'Jetpack Comments' } )
		).not.toBeInTheDocument();
		expect( screen.queryByRole( 'checkbox', { name: 'Jetpack Scan' } ) ).not.toBeInTheDocument();
	} );

	it( 'shows connection-required badges on unavailable feature rows', async () => {
		render(
			<OfflineMode
				activateModule={ jest.fn() }
				deactivateModule={ jest.fn() }
				fetchModules={ jest.fn() }
			/>
		);

		const row = await screen.findByRole( 'group', {
			name: 'Jetpack Comments',
		} );

		expect( row ).toHaveClass( 'jp-offline-mode__feature-row' );
		expect( row ).toHaveTextContent(
			'Requires a WordPress.com connection for enhanced commenting.'
		);
		expect( within( row ).getByText( 'Connection required' ) ).toHaveClass(
			'jp-offline-mode__connection-required-badge'
		);
	} );

	it( 'optimistically activates an inactive feature with its underlying module', async () => {
		let resolveActivate;
		const activateModule = jest.fn(
			() =>
				new Promise( resolve => {
					resolveActivate = resolve;
				} )
		);
		const fetchModules = jest.fn().mockResolvedValue();

		render(
			<OfflineMode
				activateModule={ activateModule }
				deactivateModule={ jest.fn() }
				fetchModules={ fetchModules }
			/>
		);

		const blocksToggle = await screen.findByRole( 'checkbox', { name: 'Blocks' } );
		await userEvent.click( blocksToggle );

		expect( activateModule ).toHaveBeenCalledWith( 'blocks' );
		expect( blocksToggle ).toBeChecked();
		expect( screen.getByText( 'Saving' ) ).toBeInTheDocument();

		await act( async () => {
			resolveActivate();
		} );
		await waitFor( () => expect( fetchModules ).toHaveBeenCalled() );
		expect( apiFetch ).toHaveBeenCalledTimes( 2 );
		await waitFor( () =>
			expect( screen.getByRole( 'checkbox', { name: 'Blocks' } ) ).not.toBeChecked()
		);
	} );

	it( 'keeps feature rows visible while refreshing after a feature update', async () => {
		let resolveActivate;
		let resolveFeatureRefresh;
		const activateModule = jest.fn(
			() =>
				new Promise( resolve => {
					resolveActivate = resolve;
				} )
		);
		const fetchModules = jest.fn().mockResolvedValue();

		apiFetch.mockResolvedValueOnce( offlineFeaturesResponse ).mockImplementationOnce(
			() =>
				new Promise( resolve => {
					resolveFeatureRefresh = resolve;
				} )
		);

		render(
			<OfflineMode
				activateModule={ activateModule }
				deactivateModule={ jest.fn() }
				fetchModules={ fetchModules }
			/>
		);

		const blocksToggle = await screen.findByRole( 'checkbox', { name: 'Blocks' } );
		await userEvent.click( blocksToggle );

		await act( async () => {
			resolveActivate();
		} );

		await waitFor( () => expect( fetchModules ).toHaveBeenCalled() );
		expect( screen.queryByText( 'Loading Offline Mode features…' ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'checkbox', { name: 'Blocks' } ) ).toBeInTheDocument();

		await act( async () => {
			resolveFeatureRefresh( offlineFeaturesResponse );
		} );
	} );

	it( 'reverts optimistic state when a feature update fails', async () => {
		let rejectActivate;
		const activateModule = jest.fn(
			() =>
				new Promise( ( resolve, reject ) => {
					void resolve;
					rejectActivate = reject;
				} )
		);

		render(
			<OfflineMode
				activateModule={ activateModule }
				deactivateModule={ jest.fn() }
				fetchModules={ jest.fn() }
			/>
		);

		const blocksToggle = await screen.findByRole( 'checkbox', { name: 'Blocks' } );
		await userEvent.click( blocksToggle );

		expect( blocksToggle ).toBeChecked();
		await act( async () => {
			rejectActivate( new Error( 'Nope' ) );
		} );
		await waitFor( () => expect( blocksToggle ).not.toBeChecked() );
	} );

	it( 'activates recommended inactive features only', async () => {
		const activateModule = jest.fn().mockResolvedValue();

		render(
			<OfflineMode
				activateModule={ activateModule }
				deactivateModule={ jest.fn() }
				fetchModules={ jest.fn() }
			/>
		);

		await expect( screen.findByRole( 'checkbox', { name: 'Forms' } ) ).resolves.toBeChecked();
		await userEvent.click( screen.getByRole( 'button', { name: 'Enable recommended' } ) );

		expect( activateModule ).toHaveBeenCalledTimes( 1 );
		expect( activateModule ).toHaveBeenCalledWith( 'blocks' );
	} );

	it( 'explains when recommended features are already enabled', async () => {
		apiFetch.mockResolvedValue( {
			...offlineFeaturesResponse,
			features: offlineFeaturesResponse.features.map( feature =>
				feature.recommended ? { ...feature, active: true } : feature
			),
		} );

		render(
			<OfflineMode
				activateModule={ jest.fn() }
				deactivateModule={ jest.fn() }
				fetchModules={ jest.fn() }
			/>
		);

		const recommendedButton = await screen.findByRole( 'button', {
			name: 'Recommended enabled',
		} );

		expect( recommendedButton ).toBeDisabled();
		expect( recommendedButton ).toHaveClass( 'jp-offline-mode__recommended-button--with-icon' );
		expect(
			screen.queryByRole( 'button', { name: 'Enable recommended' } )
		).not.toBeInTheDocument();
	} );

	it( 'refreshes after recommended activations settle when one activation fails', async () => {
		const fetchModules = jest.fn().mockResolvedValue();
		let resolveBlocksActivation;
		const activateModule = jest.fn( module => {
			if ( 'contact-form' === module ) {
				return Promise.reject( new Error( 'Nope' ) );
			}

			return new Promise( resolve => {
				resolveBlocksActivation = resolve;
			} );
		} );

		apiFetch.mockResolvedValue( {
			...offlineFeaturesResponse,
			features: offlineFeaturesResponse.features.map( feature => ( {
				...feature,
				active: false,
			} ) ),
		} );

		render(
			<OfflineMode
				activateModule={ activateModule }
				deactivateModule={ jest.fn() }
				fetchModules={ fetchModules }
			/>
		);

		await expect( screen.findByRole( 'checkbox', { name: 'Forms' } ) ).resolves.toBeInTheDocument();
		await userEvent.click( screen.getByRole( 'button', { name: 'Enable recommended' } ) );

		expect( activateModule ).toHaveBeenCalledWith( 'contact-form' );
		expect( activateModule ).toHaveBeenCalledWith( 'blocks' );
		expect( fetchModules ).not.toHaveBeenCalled();

		resolveBlocksActivation();

		await waitFor( () => expect( fetchModules ).toHaveBeenCalledTimes( 1 ) );
		expect( apiFetch ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'optimistically deactivates an active feature with its underlying module', async () => {
		let resolveDeactivate;
		const deactivateModule = jest.fn(
			() =>
				new Promise( resolve => {
					resolveDeactivate = resolve;
				} )
		);
		const fetchModules = jest.fn().mockResolvedValue();

		render(
			<OfflineMode
				activateModule={ jest.fn() }
				deactivateModule={ deactivateModule }
				fetchModules={ fetchModules }
			/>
		);

		const formsToggle = await screen.findByRole( 'checkbox', { name: 'Forms' } );
		await userEvent.click( formsToggle );

		expect( deactivateModule ).toHaveBeenCalledWith( 'contact-form' );
		expect( formsToggle ).not.toBeChecked();

		await act( async () => {
			resolveDeactivate();
		} );
		await waitFor( () => expect( fetchModules ).toHaveBeenCalled() );
		expect( apiFetch ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'shows an error if loading dashboard data fails', async () => {
		apiFetch.mockRejectedValue( new Error( 'Nope' ) );

		render(
			<OfflineMode
				activateModule={ jest.fn() }
				deactivateModule={ jest.fn() }
				fetchModules={ jest.fn() }
			/>
		);

		await waitFor( () => {
			expect(
				screen.getAllByText( 'Offline Mode features could not be loaded.' ).length
			).toBeGreaterThan( 0 );
		} );
	} );
} );
