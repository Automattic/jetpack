import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import type { SettingsResponse } from '../../../data/settings-types';
import type { SettingsForm } from '../../../data/use-settings';

// `--experimental-vm-modules` (true ESM): mock with `jest.unstable_mockModule`
// and import the component under test dynamically after the mocks are registered.
const isGated = jest.fn< () => boolean >();

jest.unstable_mockModule( '../../../data/is-gated', () => ( {
	isGated,
	getUpsellUrl: () => 'https://wordpress.com/checkout/example.com/value_bundle',
} ) );

jest.unstable_mockModule( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
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
		verification: { google: '', bing: '', pinterest: '', yandex: '', facebook: '' },
		search_engines_visible: true,
		sitemap_active: false,
		sitemap_url: '',
		canonical_active: false,
		schema: {} as SettingsResponse[ 'schema' ],
	};

	return {
		local,
		isSaving: false,
		setField: jest.fn(),
		setSchemaSettings: jest.fn(),
		setVerification: jest.fn(),
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
	} );

	it( 'keeps the front-page description on a gated site that has a legacy value', () => {
		isGated.mockReturnValue( true );

		render( <SettingsScreen form={ buildForm( true ) } /> );

		expect( screen.getByLabelText( FRONT_PAGE_LABEL ) ).toBeInTheDocument();
	} );

	it( 'shows the front-page description on an ungated site regardless of the legacy flag', () => {
		isGated.mockReturnValue( false );

		render( <SettingsScreen form={ buildForm( false ) } /> );

		expect( screen.getByLabelText( FRONT_PAGE_LABEL ) ).toBeInTheDocument();
	} );
} );
