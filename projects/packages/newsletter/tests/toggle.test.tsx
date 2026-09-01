/**
 * Tests for the `Toggle` and `ToggleWithEditorLink` DataForm `Edit` controls
 * (JETPACK-2277).
 *
 * These render the real, public `@wordpress/components` `ToggleControl` —
 * not DataViews' bundled `Edit: 'toggle'` shorthand, which resolves
 * `ValidatedToggleControl` through `@wordpress/components` private APIs and
 * breaks once Gutenberg stops exposing it there. `@wordpress/ui`'s `Link` is
 * stubbed to a plain anchor, matching the mocking convention used by the
 * other section tests in this package.
 */

const mockRecordEvent = jest.fn();

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: {
		tracks: { recordEvent: ( ...args: unknown[] ) => mockRecordEvent( ...args ) },
	},
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getAdminUrl: ( path: string ) => `https://example.com/wp-admin/${ path }`,
} ) );

jest.mock( '@wordpress/ui', () => ( {
	__esModule: true,
	Link: ( {
		children,
		href,
		onClick,
		openInNewTab,
	}: {
		children: React.ReactNode;
		href: string;
		onClick?: () => void;
		openInNewTab?: boolean;
	} ) => (
		<a
			href={ href }
			onClick={ onClick }
			target={ openInNewTab ? '_blank' : undefined }
			rel="noreferrer"
		>
			{ children }
		</a>
	),
} ) );

import { fireEvent, render, screen } from '@testing-library/react';
import { Toggle, ToggleWithEditorLink } from '../src/settings/components/toggle';
import type { NewsletterSettings } from '../src/settings/types';
import type { NormalizedField } from '@wordpress/dataviews';

/**
 * Build a minimal `NormalizedField` stand-in — `Toggle`/`ToggleWithEditorLink`
 * only read `id`, `label`, and `description` off it, never `getValue`/`setValue`
 * (the toggled value is derived straight from `data[field.id]`).
 *
 * @param overrides - Field properties to override.
 * @return A field object cast to `NormalizedField<NewsletterSettings>`.
 */
function createField(
	overrides: Partial< NormalizedField< NewsletterSettings > > = {}
): NormalizedField< NewsletterSettings > {
	return {
		id: 'jetpack_author_in_email',
		label: 'Show author display name',
		...overrides,
	} as NormalizedField< NewsletterSettings >;
}

describe( 'Toggle', () => {
	it( 'reflects the checked state from data[field.id]', () => {
		render(
			<Toggle
				data={ { jetpack_author_in_email: true } as NewsletterSettings }
				field={ createField() }
				onChange={ jest.fn() }
			/>
		);

		expect( screen.getByRole( 'checkbox', { name: 'Show author display name' } ) ).toBeChecked();
	} );

	it( 'calls onChange with the flipped value when clicked', () => {
		const onChange = jest.fn();

		render(
			<Toggle
				data={ { jetpack_author_in_email: false } as NewsletterSettings }
				field={ createField() }
				onChange={ onChange }
			/>
		);

		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'checkbox' ) );

		expect( onChange ).toHaveBeenCalledWith( { jetpack_author_in_email: true } );
	} );

	it( 'renders a plain label when url/linkText are omitted', () => {
		render(
			<Toggle
				data={ { jetpack_author_in_email: false } as NewsletterSettings }
				field={ createField() }
				onChange={ jest.fn() }
			/>
		);

		expect( screen.getByText( 'Show author display name' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );

	it( 'renders a link in the label when url and linkText are set', () => {
		render(
			<Toggle
				data={ { jetpack_gravatar_in_email: false } as NewsletterSettings }
				field={ createField( {
					id: 'jetpack_gravatar_in_email',
					label: 'Show author avatar on your emails',
				} ) }
				onChange={ jest.fn() }
				url="https://gravatar.com/profile/avatars"
				linkText="Update your Gravatar"
			/>
		);

		expect( screen.getByText( 'Show author avatar on your emails' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Update your Gravatar' } ) ).toHaveAttribute(
			'href',
			'https://gravatar.com/profile/avatars'
		);
	} );

	it( 'calls onLinkClick, not onChange, when the label link is clicked', () => {
		const onChange = jest.fn();
		const onLinkClick = jest.fn();

		render(
			<Toggle
				data={ {} as NewsletterSettings }
				field={ createField() }
				onChange={ onChange }
				url="https://example.com"
				linkText="Learn more"
				onLinkClick={ onLinkClick }
			/>
		);

		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'link', { name: 'Learn more' } ) );

		expect( onLinkClick ).toHaveBeenCalledTimes( 1 );
		expect( onChange ).not.toHaveBeenCalled();
	} );
} );

describe( 'ToggleWithEditorLink', () => {
	const field = createField( { id: 'stb_enabled', label: 'Enable subscribe block' } );

	beforeEach( () => {
		mockRecordEvent.mockClear();
	} );

	it( 'links to the site editor for the given template', () => {
		render(
			<ToggleWithEditorLink
				data={ {} as NewsletterSettings }
				field={ field }
				onChange={ jest.fn() }
				themeStylesheet="twentytwentyfour"
				postType="wp_template"
				templateId="single"
			/>
		);

		const href = screen.getByRole( 'link', { name: 'Preview and edit' } ).getAttribute( 'href' );
		expect( href ).toContain( 'site-editor.php' );
		expect( href ).toContain( 'postType=wp_template' );
		expect( href ).toContain( encodeURIComponent( 'twentytwentyfour//single' ) );
	} );

	it( 'tracks an analytics event with the site type when the link is clicked', () => {
		render(
			<ToggleWithEditorLink
				data={ {} as NewsletterSettings }
				field={ field }
				onChange={ jest.fn() }
				themeStylesheet="twentytwentyfour"
				postType="wp_template"
				templateId="single"
				siteType="simple"
			/>
		);

		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'link', { name: 'Preview and edit' } ) );

		expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_newsletter_edit_link_click', {
			site_type: 'simple',
			template: 'single',
		} );
	} );

	it( 'does not track an analytics event without a site type', () => {
		render(
			<ToggleWithEditorLink
				data={ {} as NewsletterSettings }
				field={ field }
				onChange={ jest.fn() }
				themeStylesheet="twentytwentyfour"
				postType="wp_template"
				templateId="single"
			/>
		);

		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'link', { name: 'Preview and edit' } ) );

		expect( mockRecordEvent ).not.toHaveBeenCalled();
	} );
} );
