/* eslint-disable react/jsx-no-bind, jsx-a11y/label-has-associated-control */
import { render, renderHook, screen, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch'; // eslint-disable-line import/no-unresolved
import ConnectionWizard from '../../../src/paypal-payment-buttons/components/connection-wizard';
import { usePayPalConnection } from '../../../src/paypal-payment-buttons/hooks/use-paypal-connection';
import { SANDBOX_FLAG } from '../../../src/paypal-payment-buttons/utils/sandbox-flag';

const mockHasFeatureFlag = jest.fn();
jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	hasFeatureFlag: flag => mockHasFeatureFlag( flag ),
} ) );

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: jest.fn() } },
} ) );

jest.mock( '@wordpress/data', () => ( {
	useSelect: () => false,
} ) );
jest.mock( '@wordpress/block-editor', () => ( {
	store: { name: 'core/block-editor' },
} ) );
jest.mock( '@wordpress/i18n', () => ( { __: text => text } ) );
// The snackbar dispatches to @wordpress/notices, which does not load in jsdom.
jest.mock( '../../../src/paypal-payment-buttons/utils/toast', () => ( {
	toast: jest.fn(),
} ) );
jest.mock( '../../../src/paypal-payment-buttons/icon', () => null );
jest.mock( '@wordpress/components', () => ( {
	Button: ( { children, onClick, ...props } ) => (
		<button onClick={ onClick } aria-label={ props[ 'aria-label' ] }>
			{ children }
		</button>
	),
	Notice: ( { children } ) => <div role="alert">{ children }</div>,
	TextControl: ( { label, value, onChange } ) => (
		<label>
			{ label }
			<input value={ value } onChange={ event => onChange( event.target.value ) } />
		</label>
	),
	ToggleControl: ( { label, checked, onChange } ) => (
		<label>
			{ label }
			<input
				type="checkbox"
				checked={ checked }
				onChange={ event => onChange( event.target.checked ) }
			/>
		</label>
	),
} ) );

const noop = () => {};
const wizardProps = {
	setIsConnected: noop,
	environment: 'production',
	setEnvironment: noop,
	showReconnect: false,
	setShowReconnect: noop,
	signupUrl: '',
	setOnboardingRequested: noop,
	isOpeningPayPal: false,
	clientId: '',
	clientSecret: '',
	connectError: null,
	setConnectError: noop,
	connectErrorDismissed: false,
	setConnectErrorDismissed: noop,
	isConnecting: false,
	isCompletingOnboarding: false,
	wizardStep: 'welcome',
	setWizardStep: noop,
	showSecretField: false,
	setShowSecretField: noop,
	partnerReferralsAvailable: true,
	handleClientIdChange: noop,
	handleClientSecretChange: noop,
	clientIdWarning: null,
	handleConnect: noop,
	recordWizardStarted: noop,
	fetchSignupLink: noop,
};

describe( 'Sandbox feature flag', () => {
	beforeEach( () => {
		mockHasFeatureFlag.mockReset();
		apiFetch.mockReset();
		window.localStorage.removeItem( 'jetpack-paypal-wizard-step' );
	} );

	test( 'reads the sandbox flag', () => {
		mockHasFeatureFlag.mockReturnValue( false );

		render( <ConnectionWizard { ...wizardProps } /> );

		expect( mockHasFeatureFlag ).toHaveBeenCalledWith( SANDBOX_FLAG );
		expect( SANDBOX_FLAG ).toBe( 'paypal-payments-sandbox' );
	} );

	test.each( [
		[ 'welcome', 'Use sandbox (testing)' ],
		[ 'credentials', 'Use Sandbox for testing' ],
	] )( 'hides the sandbox control on the %s step while the flag is off', ( step, control ) => {
		mockHasFeatureFlag.mockReturnValue( false );

		render( <ConnectionWizard { ...wizardProps } wizardStep={ step } /> );

		expect( screen.queryByText( control ) ).not.toBeInTheDocument();
	} );

	test.each( [
		[ 'welcome', 'Use sandbox (testing)' ],
		[ 'credentials', 'Use Sandbox for testing' ],
	] )( 'shows the sandbox control on the %s step while the flag is on', ( step, control ) => {
		mockHasFeatureFlag.mockReturnValue( true );

		render( <ConnectionWizard { ...wizardProps } wizardStep={ step } /> );

		expect( screen.getByText( control ) ).toBeInTheDocument();
	} );

	test( 'keeps the way back to production for a merchant already in the sandbox', () => {
		mockHasFeatureFlag.mockReturnValue( false );

		render(
			<ConnectionWizard { ...wizardProps } wizardStep="credentials" environment="sandbox" />
		);

		expect( screen.getByText( 'Switch to Production (Live)' ) ).toBeInTheDocument();
	} );

	test.each( [
		[ false, 'production' ],
		[ true, 'sandbox' ],
	] )(
		'with the flag %s, a disconnected site that last used the sandbox connects to %s',
		async ( flag, expected ) => {
			mockHasFeatureFlag.mockReturnValue( flag );
			apiFetch.mockResolvedValue( { connected: false, environment: 'sandbox' } );

			const { result } = renderHook( () => usePayPalConnection() );

			await waitFor( () => expect( result.current.connectionLoading ).toBe( false ) );
			await waitFor( () => expect( result.current.environment ).toBe( expected ) );
		}
	);

	test( 'leaves a site connected to the sandbox alone while the flag is off', async () => {
		mockHasFeatureFlag.mockReturnValue( false );
		apiFetch.mockResolvedValue( { connected: true, environment: 'sandbox' } );

		const { result } = renderHook( () => usePayPalConnection() );

		await waitFor( () => expect( result.current.connectionLoading ).toBe( false ) );
		expect( result.current.environment ).toBe( 'sandbox' );
	} );
} );
