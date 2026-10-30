import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import type { SettingsResponse } from '../../../data/settings-types';
import type { SettingsForm } from '../../../data/use-settings';
import type { ReactNode } from 'react';

// `--experimental-vm-modules` (true ESM): mock with `jest.unstable_mockModule`
// and import the component under test dynamically after the mocks are registered.
const isGated = jest.fn< () => boolean >();

jest.unstable_mockModule( '../../../data/is-gated', () => ( {
	isGated,
	getUpsellUrl: () => 'https://wordpress.com/checkout/example.com/value_bundle',
} ) );

jest.unstable_mockModule( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
	Link: ( { children }: { children?: ReactNode } ) => <a href="#">{ children }</a>,
} ) );

// Heavy child cards are paid surfaces hidden when gated; stub them so the screen
// renders in isolation and the presence of the front-page field is unambiguous.
jest.unstable_mockModule( '../author-profile-card', () => ( {
	default: () => <div>author</div>,
} ) );
jest.unstable_mockModule( '../schema-card', () => ( {
	default: () => <div>schema</div>,
} ) );
jest.unstable_mockModule( '../social-previews-card', () => ( {
	default: () => <div>social previews</div>,
} ) );
jest.unstable_mockModule( '../title-structure-field', () => ( {
	default: () => <div>title structure</div>,
} ) );
jest.unstable_mockModule( '../verification-card', () => ( {
	default: () => <div>verification</div>,
} ) );

const { default: SettingsScreen } = await import( '../index' );

const FRONT_PAGE_LABEL = 'Home page description';

/**
 * Build a minimal Settings form whose `local` snapshot varies only the legacy
 * front-page-meta flag; the screen reads `local` for rendering and the callbacks
 * are no-ops for these presence assertions.
 *
 * @param hasLegacy - Value for `has_legacy_front_page_meta`.
 * @return A stub Settings form.
 */
const buildForm = ( hasLegacy: boolean ): SettingsForm => {
	const local: SettingsResponse = {
		front_page_description: 'Live description.',
		has_legacy_front_page_meta: hasLegacy,
		title_formats: {},
		title_separator: '-',
		title_formats_editable: true,
		verification_tools_active: true,
		verification: { google: '', bing: '', pinterest: '', yandex: '', facebook: '' },
		search_engines_visible: true,
		site_is_private: false,
		site_is_coming_soon: false,
		site_visibility_url: '',
		sitemap_active: false,
		sitemap_switchable: true,
		sitemap_url: '',
		canonical_active: false,
		canonical_switchable: true,
		canonical_conflicted: false,
		schema: {} as SettingsResponse[ 'schema' ],
	};

	return {
		local,
		isSaving: false,
		setField: jest.fn(),
		setSchemaSettings: jest.fn(),
		setVerification: jest.fn(),
		saveVerification: jest.fn(),
		commit: jest.fn(),
		commitFields: jest.fn(),
		isDirty: () => false,
		commitTitleFormat: jest.fn(),
		isTitleFormatDirty: () => false,
	} as unknown as SettingsForm;
};

describe( 'SettingsScreen — gated front-page description', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'hides the front-page description on a gated site with no legacy value', () => {
		isGated.mockReturnValue( true );

		render( <SettingsScreen form={ buildForm( false ) } /> );

		expect( screen.queryByLabelText( FRONT_PAGE_LABEL ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Canonical URLs' } ) ).not.toBeInTheDocument();
	} );

	it( 'keeps the front-page description on a gated site that has a legacy value', () => {
		isGated.mockReturnValue( true );

		render( <SettingsScreen form={ buildForm( true ) } /> );

		expect( screen.getByLabelText( FRONT_PAGE_LABEL ) ).toHaveAttribute( 'maxlength', '300' );
		expect( screen.getByLabelText( FRONT_PAGE_LABEL ) ).toBeEnabled();
	} );

	it( 'shows the front-page description on an ungated site regardless of the legacy flag', () => {
		isGated.mockReturnValue( false );

		render( <SettingsScreen form={ buildForm( false ) } /> );

		expect( screen.getByLabelText( FRONT_PAGE_LABEL ) ).toBeInTheDocument();
	} );

	it( 'keeps the Advanced module on a gated site', () => {
		isGated.mockReturnValue( true );

		render( <SettingsScreen form={ buildForm( false ) } /> );

		// Deliberately outside the `gated` branch in the screen: gating removes paid
		// *settings*, but a gated site still has SEO tools and must keep the way to
		// switch them off. Without this, tucking the card into the gated branch would
		// go unnoticed.
		expect( screen.getByRole( 'heading', { level: 2, name: /Advanced/ } ) ).toBeInTheDocument();
	} );

	describe( 'while Jetpack SEO output is paused', () => {
		afterEach( () => {
			delete ( window as unknown as { JetpackScriptData?: unknown } ).JetpackScriptData;
		} );

		// Neither the banner nor the lock is a paid surface.
		it.each( [
			[
				'Yoast SEO',
				'Yoast SEO is managing your site’s SEO, so Jetpack has paused its SEO titles, descriptions, canonical URLs, structured data and llms.txt. Your saved settings are kept. Deactivate Yoast SEO to use them.',
				'Paused while Yoast SEO is active.',
			],
			[
				'',
				'Jetpack’s SEO titles, descriptions, structured data and llms.txt are turned off on this site. Your saved settings are kept.',
				'Paused on this site.',
			],
		] )(
			'shows the banner and locks the legacy description, with "%s" in charge',
			( plugin, banner, line ) => {
				isGated.mockReturnValue( true );
				( window as unknown as { JetpackScriptData?: unknown } ).JetpackScriptData = {
					site: { admin_url: 'https://example.com/wp-admin/' },
					seo: { output: { paused: true, conflicting_plugin: plugin } },
				};

				render( <SettingsScreen form={ buildForm( true ) } /> );

				expect( screen.getByText( banner ) ).toBeInTheDocument();
				expect( screen.getByLabelText( FRONT_PAGE_LABEL ) ).toBeDisabled();
				expect( screen.getByText( line ) ).toBeInTheDocument();
			}
		);
	} );
} );
