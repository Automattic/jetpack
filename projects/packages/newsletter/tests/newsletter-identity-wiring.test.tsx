// `newsletter-identity-focus.test.tsx` covers the card itself. This suite covers
// the bridge between `NewsletterSettingsBody` and WordPress core-data: loading
// the root site entity, staging edits, saving, and enforcing update permission.

const mockCreateNotice = jest.fn();
const mockCanUser = jest.fn< boolean | undefined, [] >();
const mockIsSavingEntityRecord = jest.fn< boolean, [] >();
const mockEditSiteIdentity = jest.fn();
const mockSaveSiteIdentity = jest.fn();
const mockUseEntityRecord = jest.fn();

const mockSiteEntity: {
	editedRecord: Record< string, string >;
	edits: Record< string, string >;
	hasResolved: boolean;
	edit: jest.Mock;
	save: jest.Mock;
} = {
	editedRecord: {},
	edits: {},
	hasResolved: true,
	edit: mockEditSiteIdentity,
	save: mockSaveSiteIdentity,
};

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

jest.mock( '@wordpress/core-data', () => ( {
	store: { name: 'core' },
	useEntityRecord: ( ...args: unknown[] ) => mockUseEntityRecord( ...args ),
} ) );

jest.mock( '@wordpress/components', () => ( {
	Disabled: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
	Spinner: () => <div data-testid="spinner" />,
} ) );

jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( { createNotice: mockCreateNotice } ),
	useSelect: ( callback: ( select: () => Record< string, jest.Mock > ) => unknown ) =>
		callback( () => ( {
			canUser: mockCanUser,
			isSavingEntityRecord: mockIsSavingEntityRecord,
		} ) ),
} ) );

jest.mock( '@wordpress/notices', () => ( {
	store: { name: 'notices' },
} ) );

jest.mock( '@wordpress/ui', () => ( {
	Notice: {
		Root: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
		Description: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
	},
	Stack: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
} ) );

jest.mock( '../src/settings/api', () => ( {
	fetchSettings: jest.fn(),
	updateSettings: jest.fn(),
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
import { fetchSettings } from '../src/settings/api';
import {
	NewsletterSettingsBody,
	__resetNewsletterSettingsCacheForTests,
} from '../src/settings/newsletter-settings';

const IDENTITY = { title: 'My Newsletter', description: 'A tagline' };

describe( 'Newsletter identity core-data wiring', () => {
	beforeEach( () => {
		__resetNewsletterSettingsCacheForTests();
		identityProps.current = null;
		jest.clearAllMocks();

		( fetchSettings as jest.Mock ).mockResolvedValue( { subscriptions: true } );
		mockCanUser.mockReturnValue( true );
		mockIsSavingEntityRecord.mockReturnValue( false );
		mockSiteEntity.editedRecord = { ...IDENTITY };
		mockSiteEntity.edits = {};
		mockSiteEntity.hasResolved = true;
		mockEditSiteIdentity.mockImplementation( ( updates: Record< string, string > ) => {
			mockSiteEntity.editedRecord = { ...mockSiteEntity.editedRecord, ...updates };
			mockSiteEntity.edits = { ...mockSiteEntity.edits, ...updates };
		} );
		mockSaveSiteIdentity.mockImplementation( async () => {
			mockSiteEntity.edits = {};
		} );
		mockUseEntityRecord.mockImplementation( () => mockSiteEntity );
	} );

	it( 'uses the root site entity and waits for it to resolve', async () => {
		mockSiteEntity.hasResolved = false;

		render( <NewsletterSettingsBody /> );

		await waitFor( () => expect( fetchSettings ).toHaveBeenCalled() );
		expect( screen.queryByTestId( 'newsletter-identity-section' ) ).not.toBeInTheDocument();
		expect( mockUseEntityRecord ).toHaveBeenCalledWith( 'root', 'site', undefined, {
			enabled: true,
		} );
	} );

	it( 'passes the decoded core-data identity down', async () => {
		mockSiteEntity.editedRecord = {
			title: 'Ben &amp; Jerry&#039;s',
			description: '&quot;Slow&quot; reviews',
		};

		render( <NewsletterSettingsBody /> );

		await expect(
			screen.findByTestId( 'newsletter-identity-section' )
		).resolves.toBeInTheDocument();
		expect( identityProps.current ).toEqual(
			expect.objectContaining( {
				data: { title: "Ben & Jerry's", description: '"Slow" reviews' },
				hasChanges: false,
				canUpdate: true,
			} )
		);
	} );

	it( 'stages edits in core-data', async () => {
		const view = render( <NewsletterSettingsBody /> );
		await expect(
			screen.findByTestId( 'newsletter-identity-section' )
		).resolves.toBeInTheDocument();

		act( () => {
			( identityProps.current?.onChange as ( updates: Record< string, string > ) => void )( {
				title: 'Renamed',
			} );
		} );
		view.rerender( <NewsletterSettingsBody /> );

		expect( mockEditSiteIdentity ).toHaveBeenCalledWith( { title: 'Renamed' } );
		expect( identityProps.current ).toEqual(
			expect.objectContaining( {
				data: { ...IDENTITY, title: 'Renamed' },
				hasChanges: true,
				changedKeys: [ 'title' ],
			} )
		);
		expect( mockSaveSiteIdentity ).not.toHaveBeenCalled();
	} );

	it( 'saves the staged core-data edits', async () => {
		const view = render( <NewsletterSettingsBody /> );
		await expect(
			screen.findByTestId( 'newsletter-identity-section' )
		).resolves.toBeInTheDocument();

		act( () => {
			( identityProps.current?.onChange as ( updates: Record< string, string > ) => void )( {
				title: 'Renamed',
			} );
		} );
		view.rerender( <NewsletterSettingsBody /> );
		await act( async () => {
			await ( identityProps.current?.onSave as () => Promise< void > )();
		} );

		expect( mockSaveSiteIdentity ).toHaveBeenCalledTimes( 1 );
		expect( mockCreateNotice ).toHaveBeenCalledWith( 'success', 'Newsletter identity saved', {
			type: 'snackbar',
		} );
	} );

	it( 'shows a non-editable state and does not resolve the entity without permission', async () => {
		mockCanUser.mockReturnValue( false );

		render( <NewsletterSettingsBody /> );
		await expect(
			screen.findByTestId( 'newsletter-identity-section' )
		).resolves.toBeInTheDocument();

		expect( identityProps.current ).toEqual(
			expect.objectContaining( { data: null, canUpdate: false } )
		);
		expect( mockUseEntityRecord ).toHaveBeenCalledWith( 'root', 'site', undefined, {
			enabled: false,
		} );
		await act( async () => {
			await ( identityProps.current?.onSave as () => Promise< void > )();
		} );
		expect( mockSaveSiteIdentity ).not.toHaveBeenCalled();
	} );

	it( 'waits for the capability check before rendering the section', async () => {
		mockCanUser.mockReturnValue( undefined );

		render( <NewsletterSettingsBody /> );

		await waitFor( () => expect( fetchSettings ).toHaveBeenCalled() );
		expect( screen.queryByTestId( 'newsletter-identity-section' ) ).not.toBeInTheDocument();
	} );

	it( 'reports a core-data save failure', async () => {
		const consoleError = jest.spyOn( console, 'error' ).mockImplementation( () => {} );
		mockSaveSiteIdentity.mockRejectedValue( new Error( 'No permission' ) );

		render( <NewsletterSettingsBody /> );
		await expect(
			screen.findByTestId( 'newsletter-identity-section' )
		).resolves.toBeInTheDocument();
		await act( async () => {
			await ( identityProps.current?.onSave as () => Promise< void > )();
		} );

		expect( mockCreateNotice ).toHaveBeenCalledWith( 'error', 'No permission', {
			type: 'snackbar',
			explicitDismiss: true,
		} );

		consoleError.mockRestore();
	} );
} );
