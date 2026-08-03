/**
 * Tests for the Newsletter categories section (NL-785).
 *
 * The section used to link out to wp-admin's `edit-tags.php` to add a category
 * (new terms only appeared after a full refresh); it was then reworked into a
 * single combined field that both *searches* existing categories and *creates*
 * new ones inline via a "Create ‘…’" suggestion row.
 *
 * These are integration tests: the `DataForm` stub renders the categories
 * field's real custom `Edit` control (`CreatableCategoriesControl`) with a
 * stubbed `FormTokenField`, so creating a category exercises the real
 * create/select/error wiring end to end — appearing without a refresh,
 * auto-selecting, firing analytics, and surfacing inline errors.
 */

interface TokenFieldProps {
	label?: string;
	placeholder?: string;
	value: string[];
	suggestions: string[];
	displayTransform?: ( token: string ) => string;
	onChange: ( tokens: string[] ) => void;
	onInputChange?: ( input: string ) => void;
}

// `mock`-prefixed so the jest.mock factory below may capture the field's latest
// `onChange`, letting tests simulate a multi-token change (e.g. a paste).
const mockTokenField: { onChange?: ( tokens: string[] ) => void } = {};

jest.mock( '@wordpress/components', () => ( {
	__esModule: true,
	// Minimal FormTokenField: an input that drives `onInputChange`, the selected
	// tokens, and one button per suggestion that adds it via `onChange`.
	FormTokenField: ( {
		label,
		placeholder,
		value,
		suggestions,
		displayTransform,
		onChange,
		onInputChange,
	}: TokenFieldProps ) => {
		mockTokenField.onChange = onChange;
		const show = ( token: string ) => ( displayTransform ? displayTransform( token ) : token );
		return (
			<div>
				<input
					aria-label={ label || placeholder }
					// eslint-disable-next-line react/jsx-no-bind
					onChange={ e => onInputChange?.( e.target.value ) }
				/>
				<ul aria-label="Selected categories">
					{ value.map( token => (
						<li key={ token }>{ show( token ) }</li>
					) ) }
				</ul>
				{ suggestions.map( token => (
					<button
						key={ token }
						type="button"
						// eslint-disable-next-line react/jsx-no-bind
						onClick={ () => onChange( [ ...value, token ] ) }
					>
						{ show( token ) }
					</button>
				) ) }
			</div>
		);
	},
	Icon: () => null,
} ) );

interface StubField {
	id: string;
	Edit?: ( props: Record< string, unknown > ) => React.ReactNode;
	elements?: Array< { value: string; label: string } >;
}

jest.mock( '@wordpress/dataviews', () => ( {
	__esModule: true,
	// Render each field's real custom `Edit` control (the categories field), so
	// tests drive the actual create/search behavior. Non-custom fields (the
	// enable toggle) render nothing — they aren't under test here.
	DataForm: ( {
		data,
		fields,
		onChange,
		validity,
	}: {
		data: Record< string, unknown >;
		fields: StubField[];
		onChange: ( updates: Record< string, unknown > ) => void;
		validity?: Record< string, unknown >;
	} ) => (
		<div data-testid="data-form">
			{ fields.map( field => {
				if ( typeof field.Edit === 'function' ) {
					const Edit = field.Edit;
					const normalized = {
						...field,
						getValue: ( { item }: { item: Record< string, unknown > } ) => item[ field.id ],
						setValue: ( { value }: { value: unknown } ) => ( { [ field.id ]: value } ),
						isDisabled: () => false,
					};
					return (
						<Edit
							key={ field.id }
							data={ data }
							field={ normalized }
							onChange={ onChange }
							validity={ validity?.[ field.id ] }
							hideLabelFromVision={ false }
						/>
					);
				}
				return <div key={ field.id } data-field={ field.id } />;
			} ) }
		</div>
	),
	useFormValidity: () => ( { validity: {}, isValid: true } ),
} ) );

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
	Link: ( { children, href }: { children: React.ReactNode; href?: string } ) => (
		<a href={ href }>{ children }</a>
	),
	Notice: {
		Root: ( { children }: { children: React.ReactNode } ) => <div role="alert">{ children }</div>,
		Description: ( { children }: { children: React.ReactNode } ) => <p>{ children }</p>,
	},
	Text: ( { children }: { children: React.ReactNode } ) => <span>{ children }</span>,
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

import analytics from '@automattic/jetpack-analytics';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import { createCategory, fetchCategories } from '../src/settings/api';
import { NewsletterCategoriesSection } from '../src/settings/sections/newsletter-categories-section';
import type { NewsletterSettings } from '../src/settings/types';

const mockedFetchCategories = fetchCategories as jest.MockedFunction< typeof fetchCategories >;
const mockedCreateCategory = createCategory as jest.MockedFunction< typeof createCategory >;
const mockedRecordEvent = analytics.tracks.recordEvent as jest.MockedFunction<
	typeof analytics.tracks.recordEvent
>;

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
	const button = screen.getByRole( 'button', { name } );
	act( () => {
		button.click();
	} );
}

/**
 * Type into the category search input, triggering the field's `onInputChange`.
 *
 * @param value - The text to enter.
 */
function typeSearch( value: string ): void {
	const input = screen.getByLabelText( 'Newsletter categories' ) as HTMLInputElement;
	act( () => {
		nativeInputSetter.call( input, value );
		input.dispatchEvent( new Event( 'input', { bubbles: true } ) );
	} );
}

/**
 * Render the section inside a small controlled wrapper so `onChange` updates the
 * `data` prop (as the real settings screen does), letting a created + selected
 * category render as a token without a refresh.
 *
 * @param overrides - Settings overrides merged over the defaults.
 * @return RTL helpers plus the `onChange` spy.
 */
function renderSection( overrides: Partial< NewsletterSettings > = {} ) {
	const onChange = jest.fn();

	/**
	 * Controlled wrapper that owns `data` so a create/select round-trips back
	 * into the field via `onChange`, as the real settings screen does.
	 *
	 * @return The rendered section.
	 */
	function Wrapper() {
		const [ data, setData ] = useState< NewsletterSettings >( {
			wpcom_newsletter_categories_enabled: true,
			wpcom_newsletter_categories: [],
			...overrides,
		} as NewsletterSettings );

		const handleChange = ( updates: Partial< NewsletterSettings > ) => {
			onChange( updates );
			setData( prev => ( { ...prev, ...updates } ) );
		};
		return (
			<NewsletterCategoriesSection
				data={ data }
				// eslint-disable-next-line react/jsx-no-bind
				onChange={ handleChange }
				onSave={ jest.fn() }
				isSaving={ false }
				hasChanges={ false }
				changedKeys={ [] }
				isNewsletterEnabled={ true }
			/>
		);
	}

	const utils = render( <Wrapper /> );
	return { ...utils, onChange };
}

describe( 'NewsletterCategoriesSection — combined search + create (NL-785)', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockedFetchCategories.mockResolvedValue( [ { id: 1, name: 'News' } ] );
	} );

	it( 'does not link out to wp-admin to add a category', async () => {
		renderSection();
		await expect( screen.findByText( 'News' ) ).resolves.toBeInTheDocument();

		const links = screen.queryAllByRole( 'link' ) as HTMLAnchorElement[];
		expect( links.some( link => link.getAttribute( 'href' )?.includes( 'edit-tags.php' ) ) ).toBe(
			false
		);
		// The old standalone "Add new category" affordance is gone.
		expect( screen.queryByRole( 'button', { name: 'Add new category' } ) ).not.toBeInTheDocument();
	} );

	it( 'shows a "Create" row only for a name that does not already exist', async () => {
		renderSection();
		await expect( screen.findByText( 'News' ) ).resolves.toBeInTheDocument();

		typeSearch( 'Weekly Digest' );
		expect( screen.getByRole( 'button', { name: 'Create “Weekly Digest”' } ) ).toBeInTheDocument();

		// Typing an existing name (case-insensitively) offers no create row.
		typeSearch( 'news' );
		expect( screen.queryByRole( 'button', { name: 'Create “news”' } ) ).not.toBeInTheDocument();
	} );

	it( 'creates a category from the Create row, shows it without a refresh, and selects it', async () => {
		mockedCreateCategory.mockResolvedValue( { id: 42, name: 'Weekly Digest' } );
		const { onChange } = renderSection();
		await expect( screen.findByText( 'News' ) ).resolves.toBeInTheDocument();

		typeSearch( 'Weekly Digest' );
		clickButton( 'Create “Weekly Digest”' );

		expect( mockedCreateCategory ).toHaveBeenCalledWith( 'Weekly Digest' );

		// Selected (staged for save)...
		await waitFor( () =>
			expect( onChange ).toHaveBeenCalledWith( { wpcom_newsletter_categories: [ '42' ] } )
		);
		// ...and rendered as a selected token without a page reload.
		await waitFor( () => {
			const selected = screen.getByRole( 'list', { name: 'Selected categories' } );
			expect( within( selected ).getByText( 'Weekly Digest' ) ).toBeInTheDocument();
		} );
	} );

	it( 'records a tracking event when a category is created', async () => {
		mockedCreateCategory.mockResolvedValue( { id: 42, name: 'Weekly Digest' } );
		renderSection();
		await expect( screen.findByText( 'News' ) ).resolves.toBeInTheDocument();

		typeSearch( 'Weekly Digest' );
		clickButton( 'Create “Weekly Digest”' );

		await waitFor( () =>
			expect( mockedRecordEvent ).toHaveBeenCalledWith(
				'jetpack_newsletter_category_created',
				expect.objectContaining( { site_type: 'jetpack' } )
			)
		);
	} );

	it( 'preserves a selected category absent from the loaded list instead of re-creating it', async () => {
		// "99" is selected but not returned by fetchCategories (deleted, or still
		// loading), so it renders as its raw ID. Selecting another category must
		// keep "99" as-is, not treat it as a new name to create.
		mockedFetchCategories.mockResolvedValue( [
			{ id: 1, name: 'News' },
			{ id: 2, name: 'Sports' },
		] );
		const { onChange } = renderSection( {
			wpcom_newsletter_categories: [ '1', '99' ],
		} as Partial< NewsletterSettings > );
		await expect( screen.findByRole( 'button', { name: 'Sports' } ) ).resolves.toBeInTheDocument();

		clickButton( 'Sports' );

		expect( mockedCreateCategory ).not.toHaveBeenCalled();
		expect( onChange ).toHaveBeenCalledWith( {
			wpcom_newsletter_categories: [ '1', '99', '2' ],
		} );
	} );

	it( 'selects an existing category without creating anything', async () => {
		const { onChange } = renderSection();
		await expect( screen.findByText( 'News' ) ).resolves.toBeInTheDocument();

		clickButton( 'News' );

		expect( onChange ).toHaveBeenCalledWith( { wpcom_newsletter_categories: [ '1' ] } );
		expect( mockedCreateCategory ).not.toHaveBeenCalled();
	} );

	it( 'creates every new name when a single change carries several (e.g. a paste)', async () => {
		mockedCreateCategory.mockImplementation( ( name: string ) =>
			Promise.resolve( { id: name === 'Alpha' ? 101 : 102, name } )
		);
		const { onChange } = renderSection();
		await expect( screen.findByText( 'News' ) ).resolves.toBeInTheDocument();

		// Simulate FormTokenField delivering two new names in one change.
		await act( async () => {
			mockTokenField.onChange?.( [ 'Alpha', 'Beta' ] );
		} );

		await waitFor( () => expect( mockedCreateCategory ).toHaveBeenCalledTimes( 2 ) );
		expect( mockedCreateCategory ).toHaveBeenCalledWith( 'Alpha' );
		expect( mockedCreateCategory ).toHaveBeenCalledWith( 'Beta' );
		// Both are created and selected — neither is dropped.
		await waitFor( () =>
			expect( onChange ).toHaveBeenCalledWith( {
				wpcom_newsletter_categories: [ '101', '102' ],
			} )
		);
	} );

	it( 'surfaces the friendly duplicate message for a term_exists rejection', async () => {
		mockedCreateCategory.mockRejectedValue(
			Object.assign(
				new Error( 'A term with the name provided already exists with this parent.' ),
				{ code: 'term_exists' }
			)
		);
		const { onChange } = renderSection();
		await expect( screen.findByText( 'News' ) ).resolves.toBeInTheDocument();

		typeSearch( 'News Two' );
		clickButton( 'Create “News Two”' );

		const alert = await screen.findByRole( 'alert' );
		expect( alert ).toHaveTextContent( 'This category already exists.' );
		expect( alert ).not.toHaveTextContent( 'already exists with this parent' );
		// Nothing was recorded or selected.
		expect( onChange ).not.toHaveBeenCalled();
		expect( mockedRecordEvent ).not.toHaveBeenCalledWith(
			'jetpack_newsletter_category_created',
			expect.anything()
		);
	} );

	it( 'shows a generic message for non-duplicate errors and never leaks the raw server text', async () => {
		mockedCreateCategory.mockRejectedValue(
			Object.assign( new Error( 'Sorry, you are not allowed to create terms in this taxonomy.' ), {
				code: 'rest_cannot_create',
			} )
		);
		renderSection();
		await expect( screen.findByText( 'News' ) ).resolves.toBeInTheDocument();

		typeSearch( 'Announcements' );
		clickButton( 'Create “Announcements”' );

		const alert = await screen.findByRole( 'alert' );
		expect( alert ).toHaveTextContent( 'Could not create the category. Please try again.' );
		expect( alert ).not.toHaveTextContent( 'not allowed to create terms' );
	} );

	it( 'clears the creation error once the user edits the name', async () => {
		mockedCreateCategory.mockRejectedValue(
			Object.assign( new Error( 'exists' ), { code: 'term_exists' } )
		);
		renderSection();
		await expect( screen.findByText( 'News' ) ).resolves.toBeInTheDocument();

		typeSearch( 'News Two' );
		clickButton( 'Create “News Two”' );
		await expect( screen.findByRole( 'alert' ) ).resolves.toHaveTextContent(
			'This category already exists.'
		);

		// Editing the name dismisses the error.
		typeSearch( 'News Three' );
		await waitFor( () => expect( screen.queryByRole( 'alert' ) ).not.toBeInTheDocument() );
	} );
} );
