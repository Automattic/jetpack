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

jest.unstable_mockModule( '../author-profile-card', () => ( {
	default: ( { disabled }: { disabled: boolean } ) => (
		<input aria-label="Author job title" value="Saved role" disabled={ disabled } readOnly />
	),
} ) );
jest.unstable_mockModule( '../schema-card', () => ( {
	default: ( { disabled }: { disabled: boolean } ) => (
		<input
			aria-label="Organization name"
			value="Saved organization"
			disabled={ disabled }
			readOnly
		/>
	),
} ) );
jest.unstable_mockModule( '../social-previews-card', () => ( {
	default: () => <div>social previews</div>,
} ) );
jest.unstable_mockModule( '../title-structure-field', () => ( {
	default: ( { editable, disabledReason }: { editable: boolean; disabledReason?: string } ) => (
		<div>
			<input
				aria-label="Saved title structure"
				value="Saved title"
				disabled={ ! editable }
				readOnly
			/>
			{ disabledReason && <p>{ disabledReason }</p> }
		</div>
	),
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
		conflicting_seo_plugin: '',
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

describe( 'SettingsScreen plan restrictions', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'shows saved paid controls disabled on a gated site', () => {
		isGated.mockReturnValue( true );

		render( <SettingsScreen form={ buildForm( false ) } /> );

		expect( screen.getByLabelText( FRONT_PAGE_LABEL ) ).toHaveValue( 'Live description.' );
		expect( screen.getByLabelText( FRONT_PAGE_LABEL ) ).toBeDisabled();
		expect( screen.getByLabelText( 'Organization name' ) ).toBeDisabled();
		expect( screen.getByLabelText( 'Author job title' ) ).toBeDisabled();
		expect( screen.getByLabelText( 'Saved title structure' ) ).toBeDisabled();
		expect( screen.getByLabelText( 'Add canonical URLs to archive pages' ) ).toBeDisabled();
		expect( screen.getByText( /AI crawler rules and llms.txt are paused/ ) ).toBeInTheDocument();
		expect( screen.getByText( /saved title structures still apply/ ) ).toBeInTheDocument();
	} );

	it.each( [ false, true ] )(
		'only allows a grandfathered description when SEO output is not disabled (%s)',
		outputDisabled => {
			isGated.mockReturnValue( true );
			const form = buildForm( true );
			form.local.title_formats_editable = false;
			form.local.seo_tools_disabled = outputDisabled;

			render( <SettingsScreen form={ form } /> );

			expect( screen.getByLabelText( FRONT_PAGE_LABEL ) ).toHaveAttribute( 'maxlength', '300' );
			expect( screen.getByLabelText( FRONT_PAGE_LABEL ) )[
				outputDisabled ? 'toBeDisabled' : 'toBeEnabled'
			]();
			expect( screen.getByLabelText( 'Saved title structure' ) ).toBeDisabled();
		}
	);

	it( 'shows the front-page description on an ungated site regardless of the legacy flag', () => {
		isGated.mockReturnValue( false );

		render( <SettingsScreen form={ buildForm( false ) } /> );

		expect( screen.getByLabelText( FRONT_PAGE_LABEL ) ).toBeEnabled();
		expect( screen.getByLabelText( 'Saved title structure' ) ).toBeEnabled();
		expect( screen.getByLabelText( 'Organization name' ) ).toBeEnabled();
	} );

	it( 'keeps the Advanced module on a gated site', () => {
		isGated.mockReturnValue( true );

		render( <SettingsScreen form={ buildForm( false ) } /> );

		expect( screen.getByRole( 'heading', { level: 2, name: /Advanced/ } ) ).toBeInTheDocument();
	} );
} );
