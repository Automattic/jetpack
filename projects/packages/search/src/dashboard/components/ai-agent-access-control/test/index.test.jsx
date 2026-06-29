// Mocks must precede module imports so Jest can hoist them above the
// component file's own dependency chain (which would otherwise drag in
// the full `@wordpress/components` + admin-ui stack at test time).
/* eslint-disable testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package; fireEvent is intentional. */
jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

jest.mock( '@wordpress/data', () => ( {
	useDispatch: jest.fn(),
	useSelect: jest.fn(),
} ) );

jest.mock( '@wordpress/components', () => ( {
	__esModule: true,
	ExternalLink: ( { children, className, href } ) => (
		<a className={ className } href={ href }>
			{ children }
			<span
				aria-hidden="true"
				className="components-external-link__icon"
				data-testid="external-link-icon"
			/>
		</a>
	),
	ToggleControl: ( { checked, disabled, label, onChange } ) => (
		<input
			type="checkbox"
			checked={ !! checked }
			disabled={ !! disabled }
			aria-label={ label }
			onChange={ event => onChange( event.target.checked ) }
		/>
	),
} ) );

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: jest.fn() } },
} ) );

jest.mock( 'store', () => ( { STORE_ID: 'jetpack-search-plugin-test' } ), { virtual: true } );

/* eslint-disable import/order -- mocks above must hoist before imports */
import analytics from '@automattic/jetpack-analytics';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch, useSelect } from '@wordpress/data';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AIAgentAccessControl from '../index.jsx';
/* eslint-enable import/order */

describe( 'AIAgentAccessControl', () => {
	let dispatchSpies;

	const guidelinesUrl = 'https://example.com/wp-admin/options-general.php?page=guidelines-wp-admin';

	const mockIsWpcom = isWpcom => {
		useSelect.mockImplementation( callback =>
			callback( () => ( {
				isWpcom: () => isWpcom,
			} ) )
		);
	};

	beforeEach( () => {
		jest.clearAllMocks();
		dispatchSpies = {
			updatingNotice: jest.fn(),
			removeUpdatingNotice: jest.fn(),
			successNotice: jest.fn(),
			errorNotice: jest.fn(),
		};
		useDispatch.mockReturnValue( dispatchSpies );
		mockIsWpcom( false );
	} );

	test( 'renders nothing while the initial settings request is in flight', () => {
		// Never-resolving promise keeps `isLoading` true.
		apiFetch.mockReturnValueOnce( new Promise( () => {} ) );

		const { container } = render( <AIAgentAccessControl /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	test( 'renders nothing and skips fetching settings when unavailable in this rollout context', () => {
		const { container } = render( <AIAgentAccessControl isAvailable={ false } /> );

		expect( container ).toBeEmptyDOMElement();
		expect( apiFetch ).not.toHaveBeenCalled();
	} );

	test( 'renders nothing when the setting is not exposed by the REST API', async () => {
		apiFetch.mockResolvedValueOnce( { title: 'Site', description: 'desc' } );

		const { container } = render( <AIAgentAccessControl /> );

		await waitFor( () => expect( apiFetch ).toHaveBeenCalledTimes( 1 ) );
		expect( container ).toBeEmptyDOMElement();
	} );

	test( 'renders the toggle reflecting the current stored value (true)', async () => {
		apiFetch.mockResolvedValueOnce( { jetpack_ai_agents_enabled: true } );

		render( <AIAgentAccessControl guidelinesUrl={ guidelinesUrl } /> );

		const toggle = await screen.findByRole( 'checkbox', {
			name: /Enable AI Agent Access/i,
		} );
		expect( toggle ).toBeChecked();
		expect(
			screen.getByRole( 'link', {
				name: /Set guidelines/i,
			} )
		).toHaveAttribute( 'href', guidelinesUrl );
		expect(
			screen.queryByRole( 'link', {
				name: /Learn more/i,
			} )
		).not.toBeInTheDocument();
		expect( screen.getByTestId( 'external-link-icon' ) ).toBeInTheDocument();
		expect( apiFetch ).toHaveBeenCalledWith( { path: '/wp/v2/settings' } );
	} );

	test( 'renders the toggle as off when the stored value is false', async () => {
		apiFetch.mockResolvedValueOnce( { jetpack_ai_agents_enabled: false } );

		render( <AIAgentAccessControl /> );

		const toggle = await screen.findByRole( 'checkbox', {
			name: /Enable AI Agent Access/i,
		} );
		expect( toggle ).not.toBeChecked();
		expect(
			screen.queryByRole( 'link', {
				name: /Set guidelines/i,
			} )
		).not.toBeInTheDocument();
	} );

	test( 'does not render the guidelines link when the guidelines page is unavailable', async () => {
		apiFetch.mockResolvedValueOnce( { jetpack_ai_agents_enabled: true } );

		render( <AIAgentAccessControl guidelinesUrl="" /> );

		await expect(
			screen.findByRole( 'checkbox', {
				name: /Enable AI Agent Access/i,
			} )
		).resolves.toBeInTheDocument();
		expect(
			screen.queryByRole( 'link', {
				name: /Set guidelines/i,
			} )
		).not.toBeInTheDocument();
	} );

	test( 'does not render the guidelines link when it would duplicate another control', async () => {
		apiFetch.mockResolvedValueOnce( { jetpack_ai_agents_enabled: true } );

		render( <AIAgentAccessControl guidelinesUrl={ guidelinesUrl } showGuidelinesLink={ false } /> );

		await expect(
			screen.findByRole( 'checkbox', {
				name: /Enable AI Agent Access/i,
			} )
		).resolves.toBeInTheDocument();
		expect(
			screen.queryByRole( 'link', {
				name: /Set guidelines/i,
			} )
		).not.toBeInTheDocument();
	} );

	test( 'posts the new value and dispatches success notice when toggled', async () => {
		apiFetch
			.mockResolvedValueOnce( { jetpack_ai_agents_enabled: false } )
			.mockResolvedValueOnce( { jetpack_ai_agents_enabled: true } );

		render( <AIAgentAccessControl /> );

		const toggle = await screen.findByRole( 'checkbox', {
			name: /Enable AI Agent Access/i,
		} );
		fireEvent.click( toggle );

		await waitFor( () => {
			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/wp/v2/settings',
				method: 'POST',
				data: { jetpack_ai_agents_enabled: true },
			} );
		} );

		await waitFor( () =>
			expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
				'jetpack_search_ai_agent_access_toggle',
				{
					enabled: true,
					previous_enabled: false,
					is_wpcom: false,
					surface: 'jetpack_search_dashboard',
				}
			)
		);
		expect( dispatchSpies.updatingNotice ).toHaveBeenCalled();
		expect( dispatchSpies.removeUpdatingNotice ).toHaveBeenCalled();
		expect( dispatchSpies.successNotice ).toHaveBeenCalled();
		expect( dispatchSpies.errorNotice ).not.toHaveBeenCalled();
	} );

	test( 'uses the wpcom ai-agents settings endpoint on WordPress.com', async () => {
		mockIsWpcom( true );
		apiFetch.mockResolvedValueOnce( { enabled: true } );

		render( <AIAgentAccessControl /> );

		const toggle = await screen.findByRole( 'checkbox', {
			name: /Enable AI Agent Access/i,
		} );
		expect( toggle ).toBeChecked();
		expect( apiFetch ).toHaveBeenCalledWith( { path: '/wpcom/v2/ai-agents-settings' } );
	} );

	test( 'renders nothing when the wpcom ai-agents settings endpoint marks the setting unavailable', async () => {
		mockIsWpcom( true );
		apiFetch.mockResolvedValueOnce( { enabled: false, available: false } );

		const { container } = render( <AIAgentAccessControl /> );

		await waitFor( () => expect( apiFetch ).toHaveBeenCalledTimes( 1 ) );
		expect( container ).toBeEmptyDOMElement();
	} );

	test( 'posts enabled to the wpcom ai-agents settings endpoint', async () => {
		mockIsWpcom( true );
		apiFetch.mockResolvedValueOnce( { enabled: false } ).mockResolvedValueOnce( { enabled: true } );

		render( <AIAgentAccessControl /> );

		const toggle = await screen.findByRole( 'checkbox', {
			name: /Enable AI Agent Access/i,
		} );
		fireEvent.click( toggle );

		await waitFor( () => {
			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/wpcom/v2/ai-agents-settings',
				method: 'POST',
				data: { enabled: true },
			} );
		} );

		await waitFor( () =>
			expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
				'jetpack_search_ai_agent_access_toggle',
				{
					enabled: true,
					previous_enabled: false,
					is_wpcom: true,
					surface: 'jetpack_search_dashboard',
				}
			)
		);
		expect( dispatchSpies.successNotice ).toHaveBeenCalled();
		expect( dispatchSpies.errorNotice ).not.toHaveBeenCalled();
	} );

	test( 'dispatches error notice when the save fails and does not flip enabled state', async () => {
		apiFetch
			.mockResolvedValueOnce( { jetpack_ai_agents_enabled: false } )
			.mockRejectedValueOnce( new Error( 'save failed' ) );

		render( <AIAgentAccessControl /> );

		const toggle = await screen.findByRole( 'checkbox', {
			name: /Enable AI Agent Access/i,
		} );
		fireEvent.click( toggle );

		await waitFor( () => {
			expect( dispatchSpies.errorNotice ).toHaveBeenCalled();
		} );
		expect( dispatchSpies.successNotice ).not.toHaveBeenCalled();
		expect( analytics.tracks.recordEvent ).not.toHaveBeenCalled();
		// Toggle should remain in its initial unchecked state since the
		// save failed.
		expect( toggle ).not.toBeChecked();
	} );

	test( 'renders nothing on REST error (network failure)', async () => {
		apiFetch.mockRejectedValueOnce( new Error( 'boom' ) );

		const { container } = render( <AIAgentAccessControl /> );

		await waitFor( () => expect( apiFetch ).toHaveBeenCalledTimes( 1 ) );
		expect( container ).toBeEmptyDOMElement();
	} );
} );
