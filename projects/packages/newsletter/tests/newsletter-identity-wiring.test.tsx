// `newsletter-identity-focus.test.tsx` renders the section with props handed to
// it, and `site-identity-api.test.ts` covers the endpoints. Neither touches the
// part in between: `NewsletterSettingsBody` fetching the identity, holding the
// staged edits, and saving them. Every assertion in both files still passes with
// that wiring removed, so it needs its own coverage.

jest.mock( '@automattic/jetpack-script-data', () => ( {
	isSimpleSite: jest.fn( () => false ),
	isWpcomPlatformSite: jest.fn( () => false ),
	getSiteType: jest.fn( () => 'jetpack' ),
	getSiteData: jest.fn( () => ( {
		rest_root: 'https://example.com/wp-json/',
		rest_nonce: 'test-nonce',
		wpcom: { blog_id: 123 },
	} ) ),
	getScriptData: jest.fn( () => ( { newsletter: undefined } ) ),
} ) );

jest.mock( '../src/settings/api', () => ( {
	fetchSettings: jest.fn(),
	updateSettings: jest.fn(),
	fetchSiteIdentity: jest.fn(),
	updateSiteIdentity: jest.fn(),
} ) );

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { initialize: jest.fn(), tracks: { recordEvent: jest.fn() } },
} ) );

jest.mock( '../src/settings/script-data', () => ( {
	getNewsletterScriptData: jest.fn( () => ( {} ) ),
} ) );

// Capture the props the body wires into the identity section, so the tests can
// drive `onChange` / `onSave` without going through the real card UI.
const identityProps: { current: Record< string, unknown > | null } = { current: null };

jest.mock( '../src/settings/sections', () => ( {
	EmailBylineSection: () => <div />,
	EmailContentSection: () => <div />,
	EmailDefaultsSection: () => <div />,
	EmailReplyToSettingsSection: () => <div />,
	EmailSenderSettingsSection: () => <div />,
	LegacySubscriptionsSection: () => <div />,
	NewsletterCategoriesSection: () => <div />,
	NewsletterIdentitySection: ( props: Record< string, unknown > ) => {
		identityProps.current = props;
		return <div data-testid="newsletter-identity-section" />;
	},
	NewsletterSection: () => <div />,
	PaidNewsletterSection: () => <div />,
	SubscribeModalSection: () => <div />,
	SubscriptionsSection: () => <div />,
	WelcomeEmailSection: () => <div />,
} ) );

// Imports must come after the jest.mock factories above.
import { act, render, screen, waitFor } from '@testing-library/react';
import { fetchSettings, fetchSiteIdentity, updateSiteIdentity } from '../src/settings/api';
import {
	NewsletterSettingsBody,
	__resetNewsletterSettingsCacheForTests,
} from '../src/settings/newsletter-settings';

const IDENTITY = { title: 'My Newsletter', description: 'A tagline' };

describe( 'Newsletter identity wiring', () => {
	beforeEach( () => {
		__resetNewsletterSettingsCacheForTests();
		identityProps.current = null;
		jest.clearAllMocks();

		( fetchSettings as jest.Mock ).mockResolvedValue( { subscriptions: true } );
		( fetchSiteIdentity as jest.Mock ).mockResolvedValue( IDENTITY );
		( updateSiteIdentity as jest.Mock ).mockResolvedValue( IDENTITY );
	} );

	it( 'renders the section only once the identity fetch resolves', async () => {
		( fetchSiteIdentity as jest.Mock ).mockReturnValue( new Promise( () => {} ) );

		render( <NewsletterSettingsBody /> );

		await waitFor( () => expect( fetchSettings ).toHaveBeenCalled() );
		expect( screen.queryByTestId( 'newsletter-identity-section' ) ).not.toBeInTheDocument();
	} );

	it( 'passes the fetched identity down', async () => {
		render( <NewsletterSettingsBody /> );

		await expect(
			screen.findByTestId( 'newsletter-identity-section' )
		).resolves.toBeInTheDocument();
		expect( identityProps.current ).toEqual(
			expect.objectContaining( { data: IDENTITY, hasChanges: false } )
		);
	} );

	it( 'stages an edit without saving it', async () => {
		render( <NewsletterSettingsBody /> );
		await expect(
			screen.findByTestId( 'newsletter-identity-section' )
		).resolves.toBeInTheDocument();

		act( () => {
			( identityProps.current?.onChange as ( u: Record< string, string > ) => void )( {
				title: 'Renamed',
			} );
		} );

		await waitFor( () => expect( identityProps.current?.hasChanges ).toBe( true ) );
		expect( identityProps.current?.data ).toEqual( { ...IDENTITY, title: 'Renamed' } );
		expect( identityProps.current?.changedKeys ).toEqual( [ 'title' ] );
		expect( updateSiteIdentity ).not.toHaveBeenCalled();
	} );

	it( 'saves only the fields that changed', async () => {
		render( <NewsletterSettingsBody /> );
		await expect(
			screen.findByTestId( 'newsletter-identity-section' )
		).resolves.toBeInTheDocument();

		act( () => {
			( identityProps.current?.onChange as ( u: Record< string, string > ) => void )( {
				title: 'Renamed',
			} );
		} );
		await act( async () => {
			( identityProps.current?.onSave as () => void )();
		} );

		expect( updateSiteIdentity ).toHaveBeenCalledWith( { title: 'Renamed' } );
	} );

	it( 'adopts what the server returns, since WordPress sanitizes on save', async () => {
		( updateSiteIdentity as jest.Mock ).mockResolvedValue( {
			title: 'Sanitized by WP',
			description: 'A tagline',
		} );

		render( <NewsletterSettingsBody /> );
		await expect(
			screen.findByTestId( 'newsletter-identity-section' )
		).resolves.toBeInTheDocument();

		act( () => {
			( identityProps.current?.onChange as ( u: Record< string, string > ) => void )( {
				title: '<script>Renamed</script>',
			} );
		} );
		await act( async () => {
			( identityProps.current?.onSave as () => void )();
		} );

		await waitFor( () =>
			expect( identityProps.current?.data ).toEqual( {
				title: 'Sanitized by WP',
				description: 'A tagline',
			} )
		);
		// And the staged set is cleared, so the Save button goes quiet again.
		expect( identityProps.current?.hasChanges ).toBe( false );
	} );

	it( 'leaves the rest of the page usable when the identity fetch fails', async () => {
		const consoleError = jest.spyOn( console, 'error' ).mockImplementation( () => {} );
		( fetchSiteIdentity as jest.Mock ).mockRejectedValue( new Error( 'nope' ) );

		render( <NewsletterSettingsBody /> );

		await waitFor( () => expect( fetchSettings ).toHaveBeenCalled() );
		expect( screen.queryByTestId( 'newsletter-identity-section' ) ).not.toBeInTheDocument();

		consoleError.mockRestore();
	} );
} );
