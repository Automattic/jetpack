/**
 * Tests for the Email content section's "site is private" warning notice.
 *
 * `@wordpress/ui` and `@wordpress/dataviews` are stubbed to plain HTML so we can
 * assert on the rendered output directly. The `Stack` stub forwards its `gap`
 * prop as a data attribute, which lets us guard the spacing that separates the
 * notice from the toggle below it (NL-717).
 */

jest.mock( '@wordpress/ui', () => ( {
	__esModule: true,
	Card: {
		Root: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
		Header: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
		Title: ( { children }: { children: React.ReactNode } ) => <h2>{ children }</h2>,
		Content: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
	},
	Fieldset: {
		Root: ( { children }: { children: React.ReactNode } ) => <fieldset>{ children }</fieldset>,
	},
	Stack: ( { children, gap }: { children: React.ReactNode; gap?: string } ) => (
		<div data-testid="stack" data-gap={ gap }>
			{ children }
		</div>
	),
	Notice: {
		Root: ( { children }: { children: React.ReactNode } ) => <div role="alert">{ children }</div>,
		Description: ( { children }: { children: React.ReactNode } ) => <p>{ children }</p>,
	},
} ) );

jest.mock( '@wordpress/dataviews', () => ( {
	__esModule: true,
	DataForm: () => <div data-testid="data-form" />,
} ) );

jest.mock( '../src/settings/script-data', () => ( {
	getNewsletterScriptData: jest.fn( () => ( { isSitePublic: true } ) ),
} ) );

import { render, screen } from '@testing-library/react';
import { getNewsletterScriptData } from '../src/settings/script-data';
import { EmailContentSection } from '../src/settings/sections/email-content-section';
import type { NewsletterSettings } from '../src/settings/types';

const mockedGetScriptData = getNewsletterScriptData as jest.MockedFunction<
	typeof getNewsletterScriptData
>;

/**
 * Render `<EmailContentSection>` with sensible defaults so each test only has to
 * override the props it cares about.
 *
 * @param props - Prop overrides to apply on top of the defaults.
 * @return RTL render helpers.
 */
function renderSection(
	props: Partial< React.ComponentProps< typeof EmailContentSection > > = {}
) {
	return render(
		<EmailContentSection
			data={ {} as NewsletterSettings }
			onChange={ jest.fn() }
			isNewsletterEnabled={ true }
			{ ...props }
		/>
	);
}

describe( 'EmailContentSection private-site notice', () => {
	it( 'does not render the warning notice when the site is public', () => {
		mockedGetScriptData.mockReturnValue( { isSitePublic: true } as ReturnType<
			typeof getNewsletterScriptData
		> );

		renderSection();

		expect( screen.queryByRole( 'alert' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the warning notice spaced from the form via a Stack when the site is private', () => {
		mockedGetScriptData.mockReturnValue( { isSitePublic: false } as ReturnType<
			typeof getNewsletterScriptData
		> );

		renderSection();

		const notice = screen.getByRole( 'alert' );
		expect( notice ).toBeInTheDocument();
		// The Stack gap is what keeps the notice from colliding with the toggle
		// rendered below it (NL-717). Guard it against regressions.
		const stack = screen.getByTestId( 'stack' );
		expect( stack ).toHaveAttribute( 'data-gap', 'lg' );
		expect( stack ).toContainElement( notice );
		expect( stack ).toContainElement( screen.getByTestId( 'data-form' ) );
	} );
} );
