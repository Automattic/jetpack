/**
 * Tests for the Subscribe modal heading section in the newsletter settings page.
 *
 * `@wordpress/ui` and `@wordpress/dataviews` are stubbed to plain HTML so we
 * can interact with the textarea directly and assert on the wrapper element's
 * disabled state. The component's own behaviour — placeholder, change merge,
 * analytics event, save-button gating — is exercised against the real source.
 */

jest.mock( '@wordpress/ui', () => ( {
	__esModule: true,
	Button: ( {
		children,
		onClick,
		disabled,
		loading,
		loadingAnnouncement,
	}: {
		children: React.ReactNode;
		onClick?: () => void;
		disabled?: boolean;
		loading?: boolean;
		loadingAnnouncement?: string;
	} ) => (
		<button onClick={ onClick } disabled={ disabled }>
			{ loading && loadingAnnouncement ? loadingAnnouncement : children }
		</button>
	),
	Card: {
		Root: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
		Header: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
		Title: ( { children }: { children: React.ReactNode } ) => <h2>{ children }</h2>,
		Content: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
	},
	Fieldset: {
		Root: ( { children, disabled }: { children: React.ReactNode; disabled?: boolean } ) => (
			<fieldset disabled={ disabled } data-testid="modal-fieldset">
				{ children }
			</fieldset>
		),
	},
	Text: ( { children }: { children: React.ReactNode } ) => <span>{ children }</span>,
	Link: ( {
		children,
		href,
		openInNewTab,
	}: {
		children: React.ReactNode;
		href: string;
		openInNewTab?: boolean;
	} ) => (
		<a href={ href } target={ openInNewTab ? '_blank' : undefined } rel="noreferrer">
			{ children }
		</a>
	),
} ) );

jest.mock( '@wordpress/dataviews', () => ( {
	__esModule: true,
	DataForm: ( {
		data,
		fields,
		onChange,
	}: {
		data: Record< string, string >;
		fields: Array< {
			id: string;
			label: string;
			placeholder?: string;
			description?: React.ReactNode;
		} >;
		onChange: ( updates: Record< string, string > ) => void;
	} ) => {
		const field = fields[ 0 ];
		const handleChange = ( e: React.ChangeEvent< HTMLTextAreaElement > ) =>
			onChange( { [ field.id ]: e.target.value } );
		return (
			<>
				<textarea
					aria-label={ field.label }
					placeholder={ field.placeholder }
					value={ data[ field.id ] ?? '' }
					// Test-only mock — the closure over `field.id` is intentional and
					// the re-bind-per-render cost is irrelevant in a jest render.
					// eslint-disable-next-line react/jsx-no-bind
					onChange={ handleChange }
				/>
				{ field.description && <p data-testid="field-description">{ field.description }</p> }
			</>
		);
	},
} ) );

jest.mock( '@automattic/jetpack-shared-extension-utils/components/wpcom-support-link', () => ( {
	__esModule: true,
	WpcomSupportLink: ( {
		children,
		supportLink,
	}: {
		children: React.ReactNode;
		supportLink: string;
	} ) => (
		<a href={ supportLink } data-testid="wpcom-support-link">
			{ children }
		</a>
	),
} ) );

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: {
		tracks: { recordEvent: jest.fn() },
	},
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getSiteType: jest.fn( () => 'jetpack' ),
	isWpcomPlatformSite: jest.fn( () => false ),
} ) );

import analytics from '@automattic/jetpack-analytics';
import { isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { render, screen } from '@testing-library/react';
import { SubscribeModalSection } from '../src/settings/sections/subscribe-modal-section';
import type { NewsletterSettings } from '../src/settings/types';

type MutableSettings = NewsletterSettings & {
	subscription_options?: {
		invitation?: string;
		welcome?: string;
		comment_follow?: string;
		subscribe_modal_heading?: string;
	};
};

/**
 * Build a `NewsletterSettings`-shaped object with a populated
 * `subscription_options` block. The defaults give every sub-key a stable
 * non-empty value so tests can assert the section preserves siblings when
 * the user edits only one field.
 *
 * @param overrides - Subset of settings to merge over the defaults.
 * @return Settings object ready to pass to `<SubscribeModalSection data />`.
 */
function buildData( overrides: Partial< MutableSettings > = {} ): MutableSettings {
	return {
		subscription_options: {
			invitation: 'I',
			welcome: 'W',
			comment_follow: 'CF',
			subscribe_modal_heading: 'Existing',
		},
		...overrides,
	} as MutableSettings;
}

/**
 * Render `<SubscribeModalSection>` with sensible defaults so each test only
 * has to override the props it actually cares about. Returns the captured
 * `onChange` / `onSave` mocks alongside the standard RTL render helpers.
 *
 * @param props - Prop overrides to apply on top of the defaults.
 * @return Render result plus the captured `onChange` and `onSave` jest mocks.
 */
function renderSection(
	props: Partial< React.ComponentProps< typeof SubscribeModalSection > > = {}
) {
	const onChange = jest.fn();
	const onSave = jest.fn();
	const data = ( props.data as MutableSettings ) ?? buildData();
	const utils = render(
		<SubscribeModalSection
			data={ data }
			onChange={ onChange }
			onSave={ onSave }
			isSaving={ false }
			hasChanges={ false }
			changedKeys={ [] }
			isNewsletterEnabled={ true }
			{ ...props }
		/>
	);
	return { onChange, onSave, ...utils };
}

/**
 * Drive a controlled textarea via the native value setter + an `input`
 * event so React picks the change up the same way it would from a real
 * keystroke. Used instead of `fireEvent` because this package intentionally
 * does not pull in `@testing-library/user-event` — mirrors the native
 * `.click()` pattern in the sibling `connection-gate.test.tsx`.
 *
 * @param textarea - Textarea node to populate.
 * @param value    - Value to set on the textarea.
 */
function setTextareaValue( textarea: HTMLTextAreaElement, value: string ) {
	const nativeSetter = Object.getOwnPropertyDescriptor(
		window.HTMLTextAreaElement.prototype,
		'value'
	)?.set;
	nativeSetter?.call( textarea, value );
	textarea.dispatchEvent( new Event( 'input', { bubbles: true } ) );
}

describe( 'SubscribeModalSection', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		jest.mocked( isWpcomPlatformSite ).mockReturnValue( false );
	} );

	it( 'renders the card title and a description mentioning the Button only style', () => {
		renderSection();

		expect(
			screen.getByRole( 'heading', { name: 'Subscribe modal heading' } )
		).toBeInTheDocument();
		expect( screen.getByTestId( 'field-description' ) ).toHaveTextContent( /"Button only" style/ );
	} );

	it( 'links the Button only style hint to Jetpack support docs on self-hosted sites', () => {
		renderSection();

		const link = screen.getByRole( 'link', { name: 'the "Button only" style' } );
		expect( link ).toHaveAttribute(
			'href',
			'https://jetpack.com/support/jetpack-blocks/subscription-form-block/#use-the-button-only-style'
		);
	} );

	it( 'links the Button only style hint to WordPress.com support docs on platform sites', () => {
		jest.mocked( isWpcomPlatformSite ).mockReturnValue( true );
		renderSection();

		const link = screen.getByTestId( 'wpcom-support-link' );
		expect( link ).toHaveAttribute(
			'href',
			'https://wordpress.com/support/wordpress-editor/blocks/subscribe-block/#change-the-subscription-box-appearance'
		);
		expect( link ).toHaveTextContent( 'the "Button only" style' );
	} );

	it( 'renders the textarea with the default placeholder and the current heading value', () => {
		renderSection();

		const textarea = screen.getByLabelText( 'Subscribe modal heading' ) as HTMLTextAreaElement;
		expect( textarea ).toBeInTheDocument();
		expect( textarea.placeholder ).toBe( 'Subscribe now to stay ahead and never miss a beat!' );
		expect( textarea.value ).toBe( 'Existing' );
	} );

	it( 'merges the typed value into subscription_options on change, preserving siblings', () => {
		const { onChange } = renderSection( {
			data: buildData( {
				subscription_options: {
					invitation: 'I',
					welcome: 'W',
					comment_follow: 'CF',
					subscribe_modal_heading: '',
				},
			} ),
		} );

		setTextareaValue(
			screen.getByLabelText( 'Subscribe modal heading' ) as HTMLTextAreaElement,
			'Brand new heading'
		);

		expect( onChange ).toHaveBeenLastCalledWith( {
			subscription_options: {
				invitation: 'I',
				welcome: 'W',
				comment_follow: 'CF',
				subscribe_modal_heading: 'Brand new heading',
			},
		} );
	} );

	it( 'fires analytics event with subscribe_modal section + changedKeys, then calls onSave', () => {
		const { onSave } = renderSection( {
			hasChanges: true,
			changedKeys: [ 'subscribe_modal_heading' ],
		} );

		// Native click via `.find()` mirrors the sibling tests; the package
		// doesn't pull in @testing-library/user-event.
		screen
			.getAllByRole( 'button' )
			.find( button => button.textContent === 'Save' )
			?.click();

		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_newsletter_section_save',
			expect.objectContaining( {
				section: 'subscribe_modal',
				site_type: 'jetpack',
				changed_keys: 'subscribe_modal_heading',
				change_count: 1,
			} )
		);
		expect( onSave ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'disables the Save button when there are no pending changes', () => {
		renderSection( { hasChanges: false } );
		expect( screen.getByRole( 'button', { name: 'Save' } ) ).toBeDisabled();
	} );

	it( 'disables the Save button while a save is in flight', () => {
		renderSection( { hasChanges: true, isSaving: true } );
		expect( screen.getByRole( 'button', { name: 'Saving…' } ) ).toBeDisabled();
	} );

	it( 'disables the Save button when the newsletter is not enabled', () => {
		renderSection( { hasChanges: true, isNewsletterEnabled: false } );
		expect( screen.getByRole( 'button', { name: 'Save' } ) ).toBeDisabled();
	} );

	it( 'disables the fieldset when the newsletter is not enabled', () => {
		renderSection( { isNewsletterEnabled: false } );
		expect( screen.getByTestId( 'modal-fieldset' ) ).toBeDisabled();
	} );
} );
