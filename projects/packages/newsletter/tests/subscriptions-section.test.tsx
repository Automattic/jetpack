/**
 * Tests for the "Preview and edit" link gating in the Subscriptions section.
 *
 * `@wordpress/ui` / `@wordpress/components` are stubbed to plain HTML so we can
 * assert on the rendered links directly. The component's own visibility logic —
 * show the per-placement link only when the placement is enabled AND saved, and
 * only when the site supports the Site Editor link — is exercised against the
 * real source.
 */

jest.mock( '@wordpress/ui', () => ( {
	__esModule: true,
	Button: ( {
		children,
		onClick,
		disabled,
	}: {
		children: React.ReactNode;
		onClick?: () => void;
		disabled?: boolean;
	} ) => (
		<button onClick={ onClick } disabled={ disabled }>
			{ children }
		</button>
	),
	Card: {
		Root: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
		Header: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
		Title: ( { children }: { children: React.ReactNode } ) => <h2>{ children }</h2>,
		Content: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
	},
	Fieldset: {
		Root: ( { children }: { children: React.ReactNode } ) => <fieldset>{ children }</fieldset>,
	},
	Link: ( {
		children,
		href,
	}: {
		children: React.ReactNode;
		href?: string;
		onClick?: () => void;
	} ) => <a href={ href }>{ children }</a>,
	Stack: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
	Text: ( { children, id }: { children: React.ReactNode; id?: string } ) => (
		<span id={ id }>{ children }</span>
	),
} ) );

jest.mock( '@wordpress/components', () => ( {
	__esModule: true,
	CheckboxControl: ( {
		id,
		checked,
		onChange,
	}: {
		id?: string;
		checked?: boolean;
		onChange?: ( next: boolean ) => void;
	} ) => (
		<input
			type="checkbox"
			id={ id }
			checked={ checked }
			// Test-only mock; the re-bind-per-render cost is irrelevant in a jest render.
			// eslint-disable-next-line react/jsx-no-bind
			onChange={ e => onChange?.( e.target.checked ) }
		/>
	),
	ToggleControl: ( { label }: { label: React.ReactNode } ) => <div>{ label }</div>,
} ) );

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: {
		tracks: { recordEvent: jest.fn() },
	},
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getSiteType: jest.fn( () => 'jetpack' ),
	getAdminUrl: jest.fn( ( p: string ) => `https://example.com/wp-admin/${ p }` ),
} ) );

jest.mock( '../src/settings/script-data', () => ( {
	getNewsletterScriptData: jest.fn( () => ( {
		isBlockTheme: true,
		themeStylesheet: 'twentytwentyfive',
		isSubscriptionSiteEditSupported: true,
	} ) ),
} ) );

import { render, screen } from '@testing-library/react';
import { getNewsletterScriptData } from '../src/settings/script-data';
import { SubscriptionsSection } from '../src/settings/sections/subscriptions-section';
import type { NewsletterSettings } from '../src/settings/types';

const OVERLAY_KEY = 'jetpack_subscribe_overlay_enabled';

/**
 * Build a `NewsletterSettings`-shaped object with all placement keys present so
 * tests can flip a single placement on/off without leaving the rest undefined.
 *
 * @param overrides - Subset of settings to merge over the defaults.
 * @return Settings object ready to pass to `<SubscriptionsSection data />`.
 */
function buildData( overrides: Partial< NewsletterSettings > = {} ): NewsletterSettings {
	return {
		jetpack_subscribe_overlay_enabled: false,
		sm_enabled: false,
		jetpack_subscriptions_subscribe_post_end_enabled: false,
		jetpack_subscribe_floating_button_enabled: false,
		...overrides,
	} as NewsletterSettings;
}

/**
 * Render `<SubscriptionsSection>` with sensible defaults so each test only has
 * to override the props it cares about.
 *
 * @param props - Prop overrides to apply on top of the defaults.
 * @return RTL render helpers.
 */
function renderSection(
	props: Partial< React.ComponentProps< typeof SubscriptionsSection > > = {}
) {
	const data = ( props.data as NewsletterSettings ) ?? buildData();
	// Default the saved baseline to the displayed data, so a test that only sets
	// `data` exercises the "enabled + saved" case. Tests that need divergence
	// (enabled-but-unsaved, reverted-to-saved) pass `savedData` explicitly.
	const savedData = ( props.savedData as NewsletterSettings | null | undefined ) ?? data;
	return render(
		<SubscriptionsSection
			data={ data }
			savedData={ savedData }
			onChange={ jest.fn() }
			onSave={ jest.fn() }
			isSaving={ false }
			hasChanges={ false }
			changedKeys={ [] }
			isNewsletterEnabled={ true }
			{ ...props }
		/>
	);
}

/**
 * Count the placement-grid "Preview and edit" links.
 *
 * The Navigation subgroup renders its own "Preview and edit" links — gated on
 * site capability, not on this fix — and both target the `//index` template.
 * Placement links never point at `//index`, so filtering those out isolates
 * the grid links this fix controls.
 *
 * @return The placement-grid "Preview and edit" anchors.
 */
function previewLinks(): HTMLAnchorElement[] {
	return (
		screen.queryAllByRole( 'link', { name: 'Preview and edit' } ) as HTMLAnchorElement[]
	 ).filter( link => ! link.getAttribute( 'href' )?.includes( '%2F%2Findex' ) );
}

describe( 'SubscriptionsSection — Preview and edit gating', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'shows the link for a placement that is enabled and saved', () => {
		renderSection( {
			data: buildData( { [ OVERLAY_KEY ]: true } ),
			savedData: buildData( { [ OVERLAY_KEY ]: true } ),
		} );
		expect( previewLinks() ).toHaveLength( 1 );
	} );

	it( 'hides the link for a disabled placement', () => {
		renderSection( {
			data: buildData( { [ OVERLAY_KEY ]: false } ),
			savedData: buildData( { [ OVERLAY_KEY ]: false } ),
		} );
		expect( previewLinks() ).toHaveLength( 0 );
	} );

	it( 'hides the link for an enabled placement that is not yet saved', () => {
		renderSection( {
			// Toggled on optimistically, but the saved baseline still has it off.
			data: buildData( { [ OVERLAY_KEY ]: true } ),
			savedData: buildData( { [ OVERLAY_KEY ]: false } ),
		} );
		expect( previewLinks() ).toHaveLength( 0 );
	} );

	it( 'keeps the link when a saved-on placement is toggled off then back on (reverted to saved)', () => {
		// The regression this fix targets: gating on the saved baseline, not on
		// "touched since save", so reverting an edit restores the link without a
		// round-trip to the server. `changedKeys` still reports the key as dirty.
		renderSection( {
			data: buildData( { [ OVERLAY_KEY ]: true } ),
			savedData: buildData( { [ OVERLAY_KEY ]: true } ),
			changedKeys: [ OVERLAY_KEY ],
		} );
		expect( previewLinks() ).toHaveLength( 1 );
	} );

	it( 'hides the link when the site does not support the Site Editor link', () => {
		( getNewsletterScriptData as jest.Mock ).mockReturnValueOnce( {
			isBlockTheme: false,
			themeStylesheet: '',
			isSubscriptionSiteEditSupported: false,
		} );
		renderSection( {
			data: buildData( { [ OVERLAY_KEY ]: true } ),
			savedData: buildData( { [ OVERLAY_KEY ]: true } ),
		} );
		expect( previewLinks() ).toHaveLength( 0 );
	} );

	it( 'shows links only for the saved-enabled placements in a mixed grid', () => {
		renderSection( {
			data: buildData( {
				jetpack_subscribe_overlay_enabled: true, // enabled + saved -> link
				sm_enabled: true, // enabled but unsaved -> no link
				jetpack_subscribe_floating_button_enabled: true, // enabled + saved -> link
			} ),
			savedData: buildData( {
				jetpack_subscribe_overlay_enabled: true,
				sm_enabled: false, // baseline still off
				jetpack_subscribe_floating_button_enabled: true,
			} ),
		} );
		expect( previewLinks() ).toHaveLength( 2 );
	} );
} );
