/**
 * Tests for the Newsletter identity section taking focus on arrival.
 *
 * The Dashboard's "Make it yours" row links here with a `focus` hint, so the
 * visitor lands on the field the row promised rather than on a full settings
 * screen with no cue. The hint rides inside the SPA router's `p` param, and is
 * read off the address rather than through the router — this section also
 * renders on the legacy settings surface, which mounts outside any route
 * context.
 *
 * `@wordpress/ui` and `@wordpress/dataviews` are stubbed to plain HTML, the way
 * the sibling section suites do. The `DataForm` stub renders the fields it is
 * given as real inputs, in the declared order, since which input ends up
 * focused is the whole point here.
 */

jest.mock( '@wordpress/ui', () => ( {
	__esModule: true,
	Card: {
		Root: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
		Header: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
		Title: ( { children }: { children: React.ReactNode } ) => <h2>{ children }</h2>,
		Content: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
	},
	Button: ( { children }: { children: React.ReactNode } ) => <button>{ children }</button>,
	Notice: {
		Root: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
		Description: ( { children }: { children: React.ReactNode } ) => <p>{ children }</p>,
	},
	// A real <fieldset> rather than a passthrough, so `disabled` genuinely
	// disables the inputs inside it the way the component relies on.
	Fieldset: {
		Root: ( { children, disabled }: { children: React.ReactNode; disabled?: boolean } ) => (
			<fieldset disabled={ disabled }>{ children }</fieldset>
		),
	},
} ) );

jest.mock( '@wordpress/dataviews', () => ( {
	__esModule: true,
	DataForm: ( { data, form }: { data: Record< string, string >; form: { fields: string[] } } ) => (
		<div>
			{ form.fields.map( ( field: string ) => (
				<input key={ field } aria-label={ field } defaultValue={ data[ field ] } />
			) ) }
		</div>
	),
} ) );

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: jest.fn() } },
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getSiteType: () => 'jetpack',
} ) );

import { render, screen } from '@testing-library/react';
import { NewsletterIdentitySection } from '../src/settings/sections/newsletter-identity-section';

const NEWSLETTER_PAGE = '/wp-admin/admin.php?page=jetpack-newsletter';

/**
 * Point the address at the Settings tab, optionally carrying a focus hint, the
 * way `Mode::get_settings_slug()` builds it: the SPA path and search packed
 * into a single encoded `p` param.
 *
 * @param focus - Focus hint to carry, if any.
 */
function visitSettings( focus?: string ): void {
	const path = `/?tab=settings${ focus ? `&focus=${ focus }` : '' }`;

	window.history.replaceState( {}, '', `${ NEWSLETTER_PAGE }&p=${ encodeURIComponent( path ) }` );
}

const renderSection = ( {
	isSaving = false,
	canUpdate = true,
}: { isSaving?: boolean; canUpdate?: boolean } = {} ) =>
	render(
		<NewsletterIdentitySection
			data={ { title: 'My Newsletter', description: 'A tagline' } }
			canUpdate={ canUpdate }
			onChange={ jest.fn() }
			onSave={ jest.fn() }
			isSaving={ isSaving }
			hasChanges={ false }
		/>
	);

afterEach( () => {
	window.history.replaceState( {}, '', NEWSLETTER_PAGE );
} );

describe( 'Newsletter identity section focus', () => {
	it( 'focuses the title when the address asks for it', () => {
		visitSettings( 'newsletter-title' );

		renderSection();

		expect( screen.getByLabelText( 'title' ) ).toHaveFocus();
	} );

	it( 'selects the existing name so it can be typed straight over', () => {
		visitSettings( 'newsletter-title' );

		renderSection();

		const input = screen.getByLabelText( 'title' ) as HTMLInputElement;

		expect( input.selectionStart ).toBe( 0 );
		expect( input.selectionEnd ).toBe( 'My Newsletter'.length );
	} );

	it( 'leaves focus alone when the Settings tab is opened without the hint', () => {
		visitSettings();

		renderSection();

		expect( screen.getByLabelText( 'title' ) ).not.toHaveFocus();
	} );

	it( 'ignores a hint meant for some other field', () => {
		visitSettings( 'something-else' );

		renderSection();

		expect( screen.getByLabelText( 'title' ) ).not.toHaveFocus();
	} );

	it( 'leaves focus alone on the legacy surface, which carries no `p` param', () => {
		// The legacy settings page mounts this section outside the router, so
		// there is no packed param to read.
		window.history.replaceState( {}, '', NEWSLETTER_PAGE );

		renderSection();

		expect( screen.getByLabelText( 'title' ) ).not.toHaveFocus();
	} );
} );

describe( 'Newsletter identity section while saving', () => {
	// The save merges the response back into state and clears the staged set, so
	// anything typed after Save was pressed would be silently thrown away.
	it( 'locks the fields until the save settles', () => {
		renderSection( { isSaving: true } );

		expect( screen.getByLabelText( 'title' ) ).toBeDisabled();
		expect( screen.getByLabelText( 'description' ) ).toBeDisabled();
	} );

	it( 'leaves them editable the rest of the time', () => {
		renderSection();

		expect( screen.getByLabelText( 'title' ) ).toBeEnabled();
		expect( screen.getByLabelText( 'description' ) ).toBeEnabled();
	} );
} );

describe( 'Newsletter identity section permissions', () => {
	it( 'explains why the fields are unavailable when the user cannot update site settings', () => {
		renderSection( { canUpdate: false } );

		expect(
			screen.getByText( 'You don’t have permission to update the newsletter title and tagline.' )
		).toBeInTheDocument();
		expect( screen.queryByLabelText( 'title' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Save' } ) ).not.toBeInTheDocument();
	} );
} );
