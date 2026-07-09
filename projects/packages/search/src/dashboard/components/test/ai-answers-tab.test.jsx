import { render, screen, waitFor } from '@testing-library/react';
import { useSelect, useDispatch } from '@wordpress/data';
import * as React from 'react';
import AiAnswersTab from '../ai-answers-tab';

jest.mock( 'store', () => ( { STORE_ID: 'jetpack-search-plugin' } ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	isWpcomPlatformSite: () => false,
} ) );

jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	getSiteFragment: () => 'example.com',
} ) );

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
	useDispatch: jest.fn(),
	createRegistryControl: jest.fn(),
	combineReducers: jest.fn( reducers => reducers ),
	registerStore: jest.fn(),
	createReduxStore: jest.fn(),
	register: jest.fn(),
} ) );

jest.mock( '@wordpress/components', () => ( {
	TextareaControl: ( { label } ) => <span>{ label }</span>,
	ToggleControl: ( { label, checked, onChange, disabled } ) => (
		<label htmlFor="toggle-control">
			<input
				id="toggle-control"
				type="checkbox"
				checked={ checked }
				onChange={ e => onChange( e.target.checked ) }
				disabled={ disabled }
			/>
			{ label }
		</label>
	),
} ) );

jest.mock( '@wordpress/ui', () => ( {
	Button: ( { children, onClick } ) => <button onClick={ onClick }>{ children }</button>,
	Link: ( { children, href } ) => <a href={ href }>{ children }</a>,
	Notice: {
		Root: ( { children } ) => <div role="status">{ children }</div>,
		Title: ( { children } ) => <div>{ children }</div>,
		Description: ( { children } ) => <div>{ children }</div>,
	},
	Stack: ( { children, className } ) => <div className={ className }>{ children }</div>,
} ) );

jest.mock( 'hooks/use-product-checkout-workflow', () => () => ( {
	run: jest.fn(),
	hasCheckoutStarted: false,
} ) );

jest.mock( 'hooks/use-ai-answers-settings', () => ( {
	__esModule: true,
	default: () => ( {
		content: '',
		setContent: jest.fn(),
		postId: null,
		isSaving: false,
		isLoading: false,
		error: null,
		saved: false,
		isUnavailable: false,
		savePersonality: jest.fn(),
	} ),
	DEFAULT_PERSONALITY: 'Default personality instructions.',
} ) );

const mockUpdateJetpackSettings = jest.fn();

/**
 * Set up mocked store state for testing.
 *
 * @param {object}  root0                        - Options.
 * @param {boolean} root0.supportsInstantSearch  - Whether the site supports instant search.
 * @param {boolean} root0.isInstantSearchEnabled - Whether instant search is enabled.
 * @param {boolean} root0.isFreePlan             - Whether the site is on a free plan.
 * @param {boolean} root0.isAiAnswersEnabled     - Whether AI Answers is enabled.
 */
function setupStore( {
	supportsInstantSearch = true,
	isInstantSearchEnabled = true,
	isFreePlan = false,
	isAiAnswersEnabled = false,
} = {} ) {
	useDispatch.mockReturnValue( {
		updateJetpackSettings: mockUpdateJetpackSettings,
	} );
	useSelect.mockImplementation( fn =>
		fn( () => ( {
			supportsInstantSearch: () => supportsInstantSearch,
			isInstantSearchEnabled: () => isInstantSearchEnabled,
			isFreePlan: () => isFreePlan,
			isAiAnswersEnabled: () => isAiAnswersEnabled,
			getBlogId: () => 1,
			getSiteAdminUrl: () => 'http://example.com/wp-admin/',
		} ) )
	);
}

describe( 'AiAnswersTab', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'shows upsell banner for free plan users', async () => {
		setupStore( { isFreePlan: true } );
		render( <AiAnswersTab /> );
		await waitFor( () => {
			expect( screen.getByText( 'Upgrade to use AI Answers' ) ).toBeInTheDocument();
		} );
		expect(
			screen.getByText( 'Give visitors real answers, not just search results.' )
		).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: /upgrade now/i } ) ).toBeInTheDocument();
	} );

	it( 'shows upsell banner when instant search is not supported', async () => {
		setupStore( { supportsInstantSearch: false } );
		render( <AiAnswersTab /> );
		await waitFor( () => {
			expect( screen.getByText( 'Upgrade to use AI Answers' ) ).toBeInTheDocument();
		} );
	} );

	it( 'does not show upsell banner for paid plan users with instant search', async () => {
		setupStore( { supportsInstantSearch: true, isFreePlan: false } );
		render( <AiAnswersTab /> );
		await waitFor( () => {
			expect( screen.queryByText( 'Upgrade to use AI Answers' ) ).not.toBeInTheDocument();
		} );
	} );

	it( 'settings section is present for paid plan users', async () => {
		setupStore( { supportsInstantSearch: true, isAiAnswersEnabled: true } );
		render( <AiAnswersTab /> );
		await expect( screen.findByText( 'Enable AI Answers' ) ).resolves.toBeInTheDocument();
	} );

	it( 'settings section is present but visually gated for free plan users', async () => {
		setupStore( { isFreePlan: true } );
		render( <AiAnswersTab /> );
		await expect( screen.findByText( 'Enable AI Answers' ) ).resolves.toBeInTheDocument();
		const gated = screen.getByTestId( 'ai-answers-settings' );
		expect( gated ).toHaveClass( 'jp-search-ai-answers-tab__settings--gated' );
	} );

	it( 'shows warning when instant search is supported but not enabled', async () => {
		setupStore( { supportsInstantSearch: true, isInstantSearchEnabled: false } );
		render( <AiAnswersTab /> );
		await expect(
			screen.findByText( 'Instant Search must be enabled for AI Answers to work.' )
		).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Enable Instant Search on the Settings tab.' ) ).toBeInTheDocument();
	} );

	it( 'toggle is not disabled when instant search is off but AI answers is already on', async () => {
		setupStore( { isInstantSearchEnabled: false, isAiAnswersEnabled: true } );
		render( <AiAnswersTab /> );
		const toggle = await screen.findByRole( 'checkbox' );
		expect( toggle ).toBeEnabled();
	} );

	it( 'toggle is disabled when both instant search and AI answers are off', async () => {
		setupStore( { isInstantSearchEnabled: false, isAiAnswersEnabled: false } );
		render( <AiAnswersTab /> );
		const toggle = await screen.findByRole( 'checkbox' );
		expect( toggle ).toBeDisabled();
	} );
} );
