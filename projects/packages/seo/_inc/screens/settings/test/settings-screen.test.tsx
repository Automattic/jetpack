import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import type { SettingsResponse } from '../../../data/settings-types';
import type { SettingsForm } from '../../../data/use-settings';
import type { ReactNode } from 'react';

// `--experimental-vm-modules` (true ESM): mock with `jest.unstable_mockModule`
// and import the components under test dynamically after the mocks are registered.
jest.unstable_mockModule( '../../../data/is-gated', () => ( {
	isGated: () => false,
	getUpsellUrl: () => 'https://wordpress.com/checkout/example.com/value_bundle',
} ) );

jest.unstable_mockModule( '@wordpress/route', () => ( {
	useSearch: () => ( {} ),
	Link: ( { children }: { children?: ReactNode } ) => <a href="#">{ children }</a>,
} ) );

// Stub the cards that own their own header, so each assertion below is
// unambiguously about the module it names. The verification card is left real —
// its completion threshold is one of the rules under test — but the Google field
// inside it reaches for the verify endpoint, so that one field is stubbed.
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
jest.unstable_mockModule( '../google-verification-field', () => ( {
	default: () => <div>google field</div>,
} ) );
jest.unstable_mockModule( '../advanced-card', () => ( {
	default: () => <div>advanced</div>,
} ) );

const { default: SettingsScreen } = await import( '../index' );

const EMPTY_VERIFICATION = {
	google: '',
	bing: '',
	pinterest: '',
	yandex: '',
	facebook: '',
};

/**
 * Settings form stub whose stored values can be varied per test; the screen
 * reads `local` for rendering and the callbacks are no-ops here.
 *
 * @param overrides - Stored settings to override on top of an all-off baseline.
 * @return A stub Settings form.
 */
const buildForm = ( overrides: Partial< SettingsResponse > = {} ): SettingsForm => {
	const local: SettingsResponse = {
		front_page_description: '',
		has_legacy_front_page_meta: false,
		title_formats: {},
		title_separator: '-',
		title_formats_editable: true,
		verification_tools_active: true,
		verification: { ...EMPTY_VERIFICATION },
		search_engines_visible: false,
		sitemap_active: false,
		sitemap_url: '',
		canonical_active: false,
		schema: {} as SettingsResponse[ 'schema' ],
		...overrides,
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

const STATUS_LABELS = [ 'Not started', 'In progress', 'Complete' ];

/**
 * The status shown in a given module's header. `Card.Title` is itself an
 * element wrapping only the title, so walk out from the title until reaching the
 * header row that also holds the status — the nearest such ancestor is this
 * module's own header, not a neighbouring module's.
 *
 * @param moduleTitle - The module's visible title.
 * @return The status label text for that module, or undefined if it has none.
 */
const statusFor = ( moduleTitle: string ): string | undefined => {
	let node: HTMLElement | null = screen.getByText( moduleTitle );
	// Bounded so a module with no status can't climb out and report a sibling's.
	for ( let depth = 0; node && depth < 4; depth++ ) {
		const text = node.textContent ?? '';
		const found = STATUS_LABELS.find( label => text.includes( label ) );
		if ( found ) {
			return found;
		}
		// eslint-disable-next-line testing-library/no-node-access -- walking from the title out to its header row.
		node = node.parentElement;
	}
	return undefined;
};

describe( 'Settings module completion status', () => {
	describe( 'Site visibility — counts its two toggles', () => {
		it( 'reports not started when neither indexing nor the sitemap is on', () => {
			render( <SettingsScreen form={ buildForm() } /> );
			expect( statusFor( 'Site visibility' ) ).toBe( 'Not started' );
		} );

		it( 'reports in progress when indexing is on but the sitemap is not', () => {
			render( <SettingsScreen form={ buildForm( { search_engines_visible: true } ) } /> );
			expect( statusFor( 'Site visibility' ) ).toBe( 'In progress' );
		} );

		it( 'reports complete when both are on', () => {
			render(
				<SettingsScreen
					form={ buildForm( { search_engines_visible: true, sitemap_active: true } ) }
				/>
			);
			expect( statusFor( 'Site visibility' ) ).toBe( 'Complete' );
		} );

		// A sitemap can't be built while indexing is blocked, so a stored-on sitemap
		// preference must not count toward completion until indexing is allowed.
		it( 'does not count a stored sitemap preference while indexing is blocked', () => {
			render(
				<SettingsScreen
					form={ buildForm( { search_engines_visible: false, sitemap_active: true } ) }
				/>
			);
			expect( statusFor( 'Site visibility' ) ).toBe( 'Not started' );
		} );
	} );

	describe( 'binary modules — no partial state', () => {
		it( 'reports canonical URLs as not started when off and complete when on', () => {
			const { unmount } = render( <SettingsScreen form={ buildForm() } /> );
			expect( statusFor( 'Canonical URLs' ) ).toBe( 'Not started' );
			unmount();

			render( <SettingsScreen form={ buildForm( { canonical_active: true } ) } /> );
			expect( statusFor( 'Canonical URLs' ) ).toBe( 'Complete' );
		} );

		it( 'reports the front-page description as not started when empty and complete when set', () => {
			const { unmount } = render( <SettingsScreen form={ buildForm() } /> );
			expect( statusFor( 'Front-page description' ) ).toBe( 'Not started' );
			unmount();

			render(
				<SettingsScreen form={ buildForm( { front_page_description: 'A description.' } ) } />
			);
			expect( statusFor( 'Front-page description' ) ).toBe( 'Complete' );
		} );
	} );

	// The count is purely informational — the field is deliberately uncapped,
	// because the real limits differ per surface (search truncates for display,
	// Jetpack's own og:description cuts at 197) and none is enforced on this save path.
	describe( 'Front-page description character count', () => {
		it( 'counts an empty description as zero, pluralized', () => {
			render( <SettingsScreen form={ buildForm() } /> );
			expect( screen.getByText( '0 characters' ) ).toBeInTheDocument();
		} );

		it( 'uses the singular form for a one-character description', () => {
			render( <SettingsScreen form={ buildForm( { front_page_description: 'x' } ) } /> );
			expect( screen.getByText( '1 character' ) ).toBeInTheDocument();
		} );

		it( 'reports the length of a filled-in description', () => {
			const description = 'A summary of the site.';
			render( <SettingsScreen form={ buildForm( { front_page_description: description } ) } /> );
			expect( screen.getByText( `${ description.length } characters` ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Site verification — one service is enough', () => {
		it( 'reports not started with no codes stored', () => {
			render( <SettingsScreen form={ buildForm() } /> );
			expect( statusFor( 'Site verification' ) ).toBe( 'Not started' );
		} );

		// Deliberate: verifying with a single search engine is the realistic end
		// state, so this module goes straight to complete and never sits at
		// in-progress (JETPACK-2051). Bing rather than Google, to show no single
		// service is privileged.
		it( 'reports complete — not in progress — with a single service verified', () => {
			render(
				<SettingsScreen
					form={ buildForm( {
						verification: { ...EMPTY_VERIFICATION, bing: 'bing-code' },
					} ) }
				/>
			);
			expect( statusFor( 'Site verification' ) ).toBe( 'Complete' );
		} );
	} );
} );

describe( 'Settings module title chips', () => {
	// The chip must not swallow the title text: the header is how these modules are
	// found by assistive tech, and by every other test in this file.
	it.each( [ 'Site visibility', 'Site verification', 'Canonical URLs', 'Front-page description' ] )(
		'renders %s with its title text and a leading icon chip',
		moduleTitle => {
			render( <SettingsScreen form={ buildForm() } /> );

			// `getByText` resolves to the chip wrapper, whose text content is the title
			// alone — the glyph beside it is a decorative SVG with no role.
			const title = screen.getByText( moduleTitle );

			expect( title ).toBeInTheDocument();
			// eslint-disable-next-line testing-library/no-node-access -- asserting the decorative glyph rendered.
			expect( title.querySelector( 'svg' ) ).toBeInTheDocument();
		}
	);
} );

describe( 'Advanced module — WordPress.com Simple', () => {
	/**
	 * Flip the dashboard into WordPress.com Simple mode by seeding the global
	 * `isSimpleSite()` reads, rather than mocking the module — that keeps
	 * `isSimpleSite()` itself in the code path under test.
	 */
	const setSimpleSite = () => {
		( window as unknown as { JetpackScriptData?: unknown } ).JetpackScriptData = {
			site: { host: 'wpcom' },
		};
	};

	afterEach( () => {
		delete ( window as unknown as { JetpackScriptData?: unknown } ).JetpackScriptData;
	} );

	it( 'renders the module on a self-hosted site', () => {
		render( <SettingsScreen form={ buildForm() } /> );

		expect( screen.getByText( 'advanced' ) ).toBeInTheDocument();
	} );

	it( 'hides it on Simple, where SEO tools cannot actually be turned off', () => {
		// `Modules::is_active()` reports every module active there, so the control
		// would appear to do nothing.
		setSimpleSite();

		render( <SettingsScreen form={ buildForm() } /> );

		expect( screen.queryByText( 'advanced' ) ).not.toBeInTheDocument();
	} );
} );

describe( 'Settings module text hierarchy', () => {
	// One rule: the small muted treatment (`body-sm`) is for explainer text attached
	// to a field. A module's own prose is body copy (`body-md`). Pinned because the
	// failure is silent — muted text still renders, it's just harder to read, which
	// is how five modules drifted into it one copy-paste at a time.
	it( 'renders a module description as body copy, not explainer text', () => {
		// Site verification is the one module this suite leaves unmocked, so it's the
		// one whose description actually renders here.
		render( <SettingsScreen form={ buildForm() } /> );

		const description = screen.getByText( /Confirm you own this site/ );
		expect( description.className ).toMatch( /body-md/ );
		expect( description.className ).not.toMatch( /body-sm/ );
		// `body-md` is also `Text`'s default, so the class alone would still pass if the
		// `variant` prop were deleted outright. The `<p>` pins that it's a real paragraph.
		expect( description.tagName ).toBe( 'P' );
	} );
} );
