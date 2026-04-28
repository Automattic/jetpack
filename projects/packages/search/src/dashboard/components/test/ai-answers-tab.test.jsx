import { render, screen, waitFor } from '@testing-library/react';
import { useSelect, useDispatch } from '@wordpress/data';
import * as React from 'react';
import AiAnswersTab from '../ai-answers-tab';

jest.mock( 'store', () => ( { STORE_ID: 'jetpack-search-plugin' } ) );

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
	useDispatch: jest.fn(),
	combineReducers: jest.fn( reducers => reducers ),
	registerStore: jest.fn(),
	createReduxStore: jest.fn(),
	register: jest.fn(),
} ) );

jest.mock( '@wordpress/components', () => ( {
	Button: ( { children, onClick } ) => <button onClick={ onClick }>{ children }</button>,
	Notice: ( { children } ) => <div role="status">{ children }</div>,
	TextareaControl: ( { label } ) => <span>{ label }</span>,

	ToggleControl: ( { label, checked, onChange } ) => (
		<label htmlFor="toggle-control">
			<input
				id="toggle-control"
				type="checkbox"
				checked={ checked }
				onChange={ e => onChange( e.target.checked ) }
			/>
			{ label }
		</label>
	),
} ) );

jest.mock( 'hooks/use-product-checkout-workflow', () => () => ( {
	run: jest.fn(),
	hasCheckoutStarted: false,
} ) );

jest.mock( '@automattic/jetpack-api', () => ( { setApiNonce: jest.fn() } ) );

jest.mock( '@wordpress/api-fetch', () => jest.fn().mockResolvedValue( [] ) );

const mockUpdateJetpackSettings = jest.fn();

/**
 * Set up mocked store state for testing.
 *
 * @param {object}  root0                    - Options.
 * @param {boolean} root0.supportsSearch     - Whether the site supports search.
 * @param {boolean} root0.isAiAnswersEnabled - Whether AI Answers is enabled.
 */
function setupStore( { supportsSearch = true, isAiAnswersEnabled = false } = {} ) {
	useDispatch.mockReturnValue( {
		updateJetpackSettings: mockUpdateJetpackSettings,
		fetchSearchPlanInfo: jest.fn().mockResolvedValue( {} ),
	} );
	useSelect.mockImplementation( fn =>
		fn( () => ( {
			supportsSearch: () => supportsSearch,
			isAiAnswersEnabled: () => isAiAnswersEnabled,
			getCalypsoSlug: () => 'example.com',
			getBlogId: () => 1,
			getSiteAdminUrl: () => 'http://example.com/wp-admin/',
			isWpcom: () => false,
			getAPINonce: () => 'nonce123',
		} ) )
	);
}

describe( 'AiAnswersTab', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'shows upsell banner for free/no-plan users', async () => {
		setupStore( { supportsSearch: false } );
		render( <AiAnswersTab /> );
		await waitFor( () => {
			expect( screen.getByText( 'Upgrade to use AI Answers' ) ).toBeInTheDocument();
		} );
		expect(
			screen.getByText( 'Give visitors real answers, not just search results.' )
		).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: /upgrade now/i } ) ).toBeInTheDocument();
	} );

	it( 'does not show upsell banner for paid plan users', async () => {
		setupStore( { supportsSearch: true } );
		render( <AiAnswersTab /> );
		await waitFor( () => {
			expect( screen.queryByText( 'Upgrade to use AI Answers' ) ).not.toBeInTheDocument();
		} );
	} );

	it( 'settings section is present for paid plan users', async () => {
		setupStore( { supportsSearch: true, isAiAnswersEnabled: true } );
		render( <AiAnswersTab /> );
		await expect( screen.findByText( 'Enable AI Answers' ) ).resolves.toBeInTheDocument();
	} );

	it( 'settings section is present but visually gated for free plan users', async () => {
		setupStore( { supportsSearch: false } );
		render( <AiAnswersTab /> );
		// The settings section still renders (just gated via CSS class)
		await expect( screen.findByText( 'Enable AI Answers' ) ).resolves.toBeInTheDocument();
		const gated = screen.getByTestId( 'ai-answers-settings' );
		expect( gated ).toHaveClass( 'jp-search-ai-answers-tab__settings--gated' );
	} );
} );
