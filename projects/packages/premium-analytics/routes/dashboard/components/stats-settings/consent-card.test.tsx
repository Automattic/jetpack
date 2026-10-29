import analytics from '@automattic/jetpack-analytics';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { ConsentCard, resetConsentCardForTesting } from './consent-card';
import { requestConsentCardFocus, resetConsentStatusForTesting } from './consent-status';

jest.mock(
	'@automattic/jetpack-analytics',
	() => jest.requireActual( '../../../../tests/js/analytics-test-utils' ).mockJetpackAnalytics
);
jest.mock( '@wordpress/api-fetch', () => jest.fn() );

const mockCreateSuccessNotice = jest.fn();
const mockCreateErrorNotice = jest.fn();
// Swaps only `useDispatch`, for the reason stats-settings.test.tsx gives.
jest.mock( '@wordpress/data', () => {
	const actual = jest.requireActual( '@wordpress/data' );
	return new Proxy( actual, {
		get: ( target, name ) =>
			name === 'useDispatch'
				? () => ( {
						createErrorNotice: mockCreateErrorNotice,
						createSuccessNotice: mockCreateSuccessNotice,
					} )
				: target[ name ],
	} );
} );

const mockApiFetch = apiFetch as unknown as jest.Mock;
const recordEvent = jest.mocked( analytics.tracks.recordEvent );

const NOT_SET_UP = {
	api_active: false,
	api_installed: false,
	consent_type_declared: false,
	banner_plugin: null,
	banner_blocks_stats: false,
	recommended_banners: [
		{ name: 'Complianz', url: 'https://wordpress.org/plugins/complianz-gdpr/' },
		{ name: 'CookieYes', url: 'https://wordpress.org/plugins/cookie-law-info/' },
	],
	can_install: true,
	can_activate: true,
	file_mods_allowed: true,
};

const setConsent = ( consent: Partial< typeof NOT_SET_UP > | undefined ) => {
	window.JetpackScriptData = {
		premium_analytics: {
			stats_settings: {
				roles: [],
				features_url: null,
				consent: consent && { ...NOT_SET_UP, ...consent },
			},
		},
	} as typeof window.JetpackScriptData;
};

const step = ( name: string ) =>
	within(
		screen
			.getAllByRole( 'listitem' )
			.find( item => within( item ).queryByText( name ) ) as HTMLElement
	);

describe( 'ConsentCard', () => {
	let user: ReturnType< typeof userEvent.setup >;

	beforeEach( () => {
		jest.useFakeTimers();
		jest.clearAllMocks();
		resetConsentStatusForTesting();
		resetConsentCardForTesting();
		user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
	} );

	afterEach( () => {
		jest.useRealTimers();
		delete window.JetpackScriptData;
	} );

	it( 'renders nothing when the site sends no consent setup', () => {
		setConsent( undefined );

		const { container } = render( <ConsentCard /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'links each recommended banner plugin when none is active', () => {
		setConsent( {} );

		render( <ConsentCard /> );

		expect(
			step( 'Cookie banner plugin' ).getByText( /^Stats didn’t find one/ )
		).toHaveTextContent( 'If not, install one, such as Complianz or CookieYes.' );
		expect( screen.getByRole( 'link', { name: /CookieYes/ } ) ).toHaveAttribute(
			'href',
			'https://wordpress.org/plugins/cookie-law-info/'
		);
	} );

	it.each( [
		[ 'nothing in place', {}, 'Not set up', 'Not found', 'Not installed' ],
		[
			'a banner and an inactive WP Consent API',
			{ banner_plugin: 'CookieYes', api_installed: true },
			'Not set up',
			'Active',
			'Inactive',
		],
		[
			'an active WP Consent API and no banner',
			{ api_installed: true, api_active: true },
			'Not set up',
			'Not found',
			'Active',
		],
		[
			'both in place',
			{ consent_type_declared: true, api_installed: true, api_active: true },
			'Set up',
			'Active',
			'Active',
		],
	] )( 'shows the state of %s', ( _title, consent, overall, banner, api ) => {
		setConsent( consent );

		render( <ConsentCard /> );

		expect( screen.getByText( overall ) ).toBeInTheDocument();
		expect( step( 'Cookie banner plugin' ).getByText( banner ) ).toBeInTheDocument();
		expect( step( 'WP Consent API' ).getByText( api ) ).toBeInTheDocument();
	} );

	it.each( [
		[
			'installs',
			'install',
			{},
			'Install and activate',
			{
				path: '/wp/v2/plugins',
				method: 'POST',
				data: { slug: 'wp-consent-api', status: 'active' },
			},
		],
		[
			'activates',
			'activate',
			{ api_installed: true },
			'Activate',
			{
				path: '/wp/v2/plugins/wp-consent-api/wp-consent-api',
				method: 'PUT',
				data: { status: 'active' },
			},
		],
	] )(
		'%s WP Consent API in place and keeps focus on its step',
		async ( _title, action, consent, label, request ) => {
			setConsent( { banner_plugin: 'Complianz', ...consent } );
			mockApiFetch.mockResolvedValue( {} );
			render( <ConsentCard /> );

			await user.click( screen.getByRole( 'button', { name: label } ) );

			expect( mockApiFetch ).toHaveBeenCalledWith( request );
			await expect( screen.findByText( 'Set up' ) ).resolves.toBeInTheDocument();
			expect( screen.queryByRole( 'button', { name: label } ) ).not.toBeInTheDocument();
			expect( step( 'WP Consent API' ).getByText( 'Active' ) ).toBeInTheDocument();
			expect( screen.getAllByRole( 'listitem' )[ 1 ] ).toHaveFocus();
			expect( mockCreateSuccessNotice ).toHaveBeenCalled();
			expect( recordEvent ).toHaveBeenCalledWith(
				'jetpack_premium_analytics_visitor_consent_setup',
				{
					action,
					result: 'success',
				}
			);
		}
	);

	it( 'still shows WP Consent API as active after switching tabs remounts the card', async () => {
		setConsent( { banner_plugin: 'Complianz', api_installed: true } );
		mockApiFetch.mockResolvedValue( {} );
		const { unmount } = render( <ConsentCard /> );
		await user.click( screen.getByRole( 'button', { name: 'Activate' } ) );
		await expect( screen.findByText( 'Set up' ) ).resolves.toBeInTheDocument();
		unmount();

		render( <ConsentCard /> );

		expect( screen.getByText( 'Set up' ) ).toBeInTheDocument();
		expect( step( 'WP Consent API' ).getByText( 'Active' ) ).toBeInTheDocument();
	} );

	it( 'counts a banner that blocks Stats itself as set up, leaving WP Consent API optional', () => {
		setConsent( { banner_plugin: 'Complianz', banner_blocks_stats: true, can_install: false } );

		render( <ConsentCard /> );

		expect( screen.getByText( 'Set up' ) ).toBeInTheDocument();
		expect( step( 'WP Consent API' ).getByText( /^Optional\./ ) ).toBeInTheDocument();
		expect( screen.queryByText( /permission to install/ ) ).not.toBeInTheDocument();
	} );

	it( 'leaves focus where the user moved it while activating', async () => {
		setConsent( { api_installed: true } );
		let activate!: ( value: unknown ) => void;
		mockApiFetch.mockReturnValue( new Promise( resolve => ( activate = resolve ) ) );
		render( <ConsentCard /> );

		await user.click( screen.getByRole( 'button', { name: 'Activate' } ) );
		const link = screen.getByRole( 'link', { name: /Complianz/ } );
		link.focus();
		activate( {} );

		await expect( step( 'WP Consent API' ).findByText( 'Active' ) ).resolves.toBeInTheDocument();
		expect( link ).toHaveFocus();
	} );

	it( 'reports a failed install with the reason WordPress gave, and keeps the button', async () => {
		setConsent( {} );
		mockApiFetch.mockRejectedValue( { message: 'Could not create directory.' } );
		render( <ConsentCard /> );

		await user.click( screen.getByRole( 'button', { name: 'Install and activate' } ) );

		expect( mockCreateErrorNotice ).toHaveBeenCalledWith(
			'WP Consent API could not be set up: Could not create directory.',
			{ id: 'stats-consent-api-failed', type: 'snackbar' }
		);
		await waitFor( () =>
			expect( screen.getByRole( 'button', { name: 'Install and activate' } ) ).toBeEnabled()
		);
		expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_premium_analytics_visitor_consent_setup', {
			action: 'install',
			result: 'error',
		} );
	} );

	it( 'treats a failed request as a success when the plugin turns out to be active', async () => {
		setConsent( { banner_plugin: 'Complianz' } );
		mockApiFetch
			.mockRejectedValueOnce( { code: 'invalid_json' } )
			.mockResolvedValueOnce( { status: 'active' } );
		render( <ConsentCard /> );

		await user.click( screen.getByRole( 'button', { name: 'Install and activate' } ) );

		await expect( screen.findByText( 'Set up' ) ).resolves.toBeInTheDocument();
		expect( screen.getAllByRole( 'listitem' )[ 1 ] ).toHaveFocus();
		expect( mockCreateSuccessNotice ).toHaveBeenCalled();
		expect( mockCreateErrorNotice ).not.toHaveBeenCalled();
	} );

	it( 'offers to activate when the install went through but activation failed', async () => {
		setConsent( {} );
		mockApiFetch
			.mockRejectedValueOnce( { message: 'Plugin could not be activated.' } )
			.mockResolvedValueOnce( { status: 'inactive' } );
		render( <ConsentCard /> );

		await user.click( screen.getByRole( 'button', { name: 'Install and activate' } ) );

		await expect(
			screen.findByRole( 'button', { name: 'Activate' } )
		).resolves.toBeInTheDocument();
		expect( step( 'WP Consent API' ).getByText( 'Inactive' ) ).toBeInTheDocument();
	} );

	it.each( [
		[
			'file modifications are disallowed',
			{ can_install: false, file_mods_allowed: false },
			'Plugins cannot be installed here due to your site configuration.',
			'file_mods',
		],
		[
			'the user cannot install plugins',
			{ can_install: false },
			'You do not have permission to install plugins here.',
			'install_permission',
		],
		[
			'the user cannot activate the installed plugin',
			{ api_installed: true, can_activate: false },
			'You do not have permission to activate plugins here.',
			'activate_permission',
		],
	] )(
		'explains why it cannot set up WP Consent API when %s',
		( _title, consent, reason, blockedBy ) => {
			setConsent( consent );

			render( <ConsentCard /> );

			expect( screen.getByText( reason, { exact: false } ) ).toBeInTheDocument();
			expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
			expect( recordEvent ).toHaveBeenCalledWith(
				'jetpack_premium_analytics_visitor_consent_card_view',
				{ set_up: false, blocked_by: blockedBy }
			);
		}
	);

	it( 'records its view once per page load', () => {
		setConsent( { consent_type_declared: true, api_installed: true, api_active: true } );

		render( <ConsentCard /> ).unmount();
		render( <ConsentCard /> );

		expect( recordEvent ).toHaveBeenCalledTimes( 1 );
		expect( recordEvent ).toHaveBeenCalledWith(
			'jetpack_premium_analytics_visitor_consent_card_view',
			{ set_up: true, blocked_by: 'none' }
		);
	} );

	it( 'takes focus once when the dashboard notice opens it', () => {
		setConsent( {} );
		requestConsentCardFocus();

		const { unmount } = render( <ConsentCard /> );

		expect( screen.getByRole( 'region', { name: 'Visitor consent' } ) ).toHaveFocus();
		unmount();
		render( <ConsentCard /> );
		expect( document.body ).toHaveFocus();
	} );

	it( 'explains nothing once WP Consent API is active, even without permission to install', () => {
		setConsent( {
			api_installed: true,
			api_active: true,
			can_install: false,
			can_activate: false,
			file_mods_allowed: false,
		} );

		render( <ConsentCard /> );

		expect( screen.queryByText( /permission|cannot be installed/ ) ).not.toBeInTheDocument();
	} );
} );
