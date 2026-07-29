/**
 * Tests for inline category creation in the Newsletter categories section (NL-785).
 *
 * The section used to link out to wp-admin's `edit-tags.php` to add a category,
 * which meant the new term only appeared after a full page refresh. These tests
 * exercise the inline "add new category" flow against the real component:
 * creating a term appends it to the list (no refresh) and auto-selects it, and
 * failures surface an inline error instead of navigating away.
 *
 * `@wordpress/ui` / `@wordpress/components` / `@wordpress/dataviews` are stubbed
 * to plain HTML. The `DataForm` stub renders the category field's `elements` so
 * we can assert a freshly created category shows up in the list without a reload.
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
		loading?: boolean;
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
	Link: ( { children, href }: { children: React.ReactNode; href?: string } ) => (
		<a href={ href }>{ children }</a>
	),
	Notice: {
		Root: ( { children }: { children: React.ReactNode } ) => <div role="alert">{ children }</div>,
		Description: ( { children }: { children: React.ReactNode } ) => <p>{ children }</p>,
	},
	Stack: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
	Text: ( { children }: { children: React.ReactNode } ) => <span>{ children }</span>,
} ) );

jest.mock( '@wordpress/components', () => ( {
	__esModule: true,
	TextControl: ( {
		label,
		value,
		onChange,
		disabled,
	}: {
		label: string;
		value: string;
		onChange: ( next: string ) => void;
		disabled?: boolean;
	} ) => (
		<input
			aria-label={ label }
			value={ value }
			disabled={ disabled }
			// Test-only mock; the re-bind-per-render cost is irrelevant in a jest render.
			// eslint-disable-next-line react/jsx-no-bind
			onChange={ e => onChange( e.target.value ) }
		/>
	),
} ) );

interface StubField {
	id: string;
	elements?: Array< { value: string; label: string } >;
}

jest.mock( '@wordpress/dataviews', () => ( {
	__esModule: true,
	// Render the category field's elements so a newly created category is
	// observable in the list without a page refresh.
	DataForm: ( { fields }: { fields: StubField[] } ) => {
		const categoryField = fields?.find( f => f.id === 'wpcom_newsletter_categories' );
		return (
			<div data-testid="data-form">
				{ categoryField?.elements?.map( el => <span key={ el.value }>{ el.label }</span> ) }
			</div>
		);
	},
	useFormValidity: () => ( { validity: {}, isValid: true } ),
} ) );

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: {
		tracks: { recordEvent: jest.fn() },
	},
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getSiteType: jest.fn( () => 'jetpack' ),
	getSiteData: jest.fn( () => ( { wpcom: { blog_id: 123 } } ) ),
	isWpcomPlatformSite: jest.fn( () => false ),
} ) );

jest.mock( '@automattic/jetpack-shared-extension-utils/components/wpcom-support-link', () => ( {
	WpcomSupportLink: () => <a href="https://example.com/support">support</a>,
} ) );

jest.mock( '../src/settings/api', () => ( {
	fetchCategories: jest.fn(),
	createCategory: jest.fn(),
} ) );

import { act, render, screen, waitFor } from '@testing-library/react';
import { createCategory, fetchCategories } from '../src/settings/api';
import { NewsletterCategoriesSection } from '../src/settings/sections/newsletter-categories-section';
import type { NewsletterSettings } from '../src/settings/types';

const mockedFetchCategories = fetchCategories as jest.MockedFunction< typeof fetchCategories >;
const mockedCreateCategory = createCategory as jest.MockedFunction< typeof createCategory >;

// The package intentionally doesn't pull in `@testing-library/user-event`
// (mirrors the sibling shell tests), so drive interactions natively.
const nativeInputSetter = Object.getOwnPropertyDescriptor(
	window.HTMLInputElement.prototype,
	'value'
)?.set as ( value: string ) => void;

/**
 * Click a button by its accessible name.
 *
 * @param name - The button's accessible name.
 */
function clickButton( name: string ): void {
	// Native click: the package doesn't pull in @testing-library/user-event.
	const button = screen.getByRole( 'button', { name } );
	act( () => {
		button.click();
	} );
}

/**
 * Set a text field's value the way a user would, triggering React's onChange.
 *
 * @param label - The field's accessible label.
 * @param value - The value to enter.
 */
function typeInto( label: string, value: string ): void {
	const input = screen.getByLabelText( label ) as HTMLInputElement;
	act( () => {
		nativeInputSetter.call( input, value );
		input.dispatchEvent( new Event( 'input', { bubbles: true } ) );
	} );
}

/**
 * Build a `NewsletterSettings`-shaped object with newsletter categories enabled.
 *
 * @param overrides - Subset of settings to merge over the defaults.
 * @return Settings object ready to pass to `<NewsletterCategoriesSection data />`.
 */
function buildData( overrides: Partial< NewsletterSettings > = {} ): NewsletterSettings {
	return {
		wpcom_newsletter_categories_enabled: true,
		wpcom_newsletter_categories: [],
		...overrides,
	} as NewsletterSettings;
}

/**
 * Render `<NewsletterCategoriesSection>` with sensible defaults so each test only
 * has to override the props it cares about.
 *
 * @param props - Prop overrides to apply on top of the defaults.
 * @return RTL render helpers plus the `onChange` spy.
 */
function renderSection(
	props: Partial< React.ComponentProps< typeof NewsletterCategoriesSection > > = {}
) {
	const onChange = ( props.onChange as jest.Mock ) ?? jest.fn();
	const utils = render(
		<NewsletterCategoriesSection
			data={ ( props.data as NewsletterSettings ) ?? buildData() }
			onChange={ onChange }
			onSave={ jest.fn() }
			isSaving={ false }
			hasChanges={ false }
			changedKeys={ [] }
			isNewsletterEnabled={ true }
			{ ...props }
		/>
	);
	return { ...utils, onChange };
}

describe( 'NewsletterCategoriesSection — inline add category (NL-785)', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockedFetchCategories.mockResolvedValue( [ { id: 1, name: 'News' } ] );
	} );

	it( 'does not link out to wp-admin to add a category', async () => {
		renderSection();
		// Wait for the initial category fetch to settle.
		await expect( screen.findByText( 'News' ) ).resolves.toBeInTheDocument();

		const links = screen.queryAllByRole( 'link' ) as HTMLAnchorElement[];
		expect( links.some( link => link.getAttribute( 'href' )?.includes( 'edit-tags.php' ) ) ).toBe(
			false
		);
		// The affordance is now an in-page action, not a navigation link.
		expect( screen.getByRole( 'button', { name: 'Add new category' } ) ).toBeInTheDocument();
	} );

	it( 'creates a category inline, shows it without a refresh, and auto-selects it', async () => {
		mockedCreateCategory.mockResolvedValue( { id: 42, name: 'Weekly Digest' } );
		const { onChange } = renderSection();
		await expect( screen.findByText( 'News' ) ).resolves.toBeInTheDocument();

		clickButton( 'Add new category' );
		typeInto( 'New category name', 'Weekly Digest' );
		clickButton( 'Add category' );

		expect( mockedCreateCategory ).toHaveBeenCalledWith( 'Weekly Digest' );

		// The new category appears in the list without a page reload...
		await expect( screen.findByText( 'Weekly Digest' ) ).resolves.toBeInTheDocument();
		// ...and is auto-selected (staged for save) alongside any existing selection.
		await waitFor( () =>
			expect( onChange ).toHaveBeenCalledWith( {
				wpcom_newsletter_categories: [ '42' ],
			} )
		);
	} );

	it( 'trims the name and does not create a whitespace-only category', async () => {
		mockedCreateCategory.mockResolvedValue( { id: 7, name: 'Trimmed' } );
		renderSection();
		await expect( screen.findByText( 'News' ) ).resolves.toBeInTheDocument();

		clickButton( 'Add new category' );
		typeInto( 'New category name', '   ' );

		// The submit button is disabled while the name is only whitespace.
		expect( screen.getByRole( 'button', { name: 'Add category' } ) ).toBeDisabled();

		typeInto( 'New category name', '  Trimmed  ' );
		clickButton( 'Add category' );

		await waitFor( () => expect( mockedCreateCategory ).toHaveBeenCalledWith( 'Trimmed' ) );
	} );

	it( 'surfaces a friendly error when the category already exists', async () => {
		mockedCreateCategory.mockRejectedValue(
			Object.assign(
				new Error( 'A term with the name provided already exists with this parent.' ),
				{ code: 'term_exists' }
			)
		);
		const { onChange } = renderSection();
		await expect( screen.findByText( 'News' ) ).resolves.toBeInTheDocument();

		clickButton( 'Add new category' );
		typeInto( 'New category name', 'News' );
		clickButton( 'Add category' );

		const alert = await screen.findByRole( 'alert' );
		expect( alert ).toHaveTextContent( 'This category already exists.' );
		// The long parent-aware core message is not shown to the user.
		expect( alert ).not.toHaveTextContent( 'already exists with this parent' );
		// Nothing was selected, and the form stays open for a retry.
		expect( onChange ).not.toHaveBeenCalled();
		expect( screen.getByLabelText( 'New category name' ) ).toBeInTheDocument();
	} );

	it( 'shows a generic message for non-duplicate errors and never leaks the raw server text', async () => {
		mockedCreateCategory.mockRejectedValue(
			Object.assign( new Error( 'Sorry, you are not allowed to create terms in this taxonomy.' ), {
				code: 'rest_cannot_create',
			} )
		);
		const { onChange } = renderSection();
		await expect( screen.findByText( 'News' ) ).resolves.toBeInTheDocument();

		clickButton( 'Add new category' );
		typeInto( 'New category name', 'Announcements' );
		clickButton( 'Add category' );

		const alert = await screen.findByRole( 'alert' );
		expect( alert ).toHaveTextContent( 'Could not create the category. Please try again.' );
		// The raw, English-only server message is not surfaced to the user.
		expect( alert ).not.toHaveTextContent( 'not allowed to create terms' );
		// Nothing was selected, and the form stays open for a retry.
		expect( onChange ).not.toHaveBeenCalled();
		expect( screen.getByLabelText( 'New category name' ) ).toBeInTheDocument();
	} );

	it( 'closes the inline form and clears input when cancelled', async () => {
		renderSection();
		await expect( screen.findByText( 'News' ) ).resolves.toBeInTheDocument();

		clickButton( 'Add new category' );
		typeInto( 'New category name', 'Discarded' );
		clickButton( 'Cancel' );

		expect( screen.queryByLabelText( 'New category name' ) ).not.toBeInTheDocument();
		expect( mockedCreateCategory ).not.toHaveBeenCalled();
		// Reopening starts from an empty field, not the discarded value.
		clickButton( 'Add new category' );
		expect( screen.getByLabelText( 'New category name' ) ).toHaveValue( '' );
	} );
} );
