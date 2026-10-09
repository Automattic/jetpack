// `@wordpress/ui` is stubbed to plain HTML so the link can be asserted on directly.

jest.mock( '@wordpress/ui', () => ( {
	__esModule: true,
	Card: {
		Root: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
		Header: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
		Title: ( { children }: { children: React.ReactNode } ) => <h2>{ children }</h2>,
		Content: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
	},
	Stack: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
	Button: ( { children, disabled }: { children: React.ReactNode; disabled?: boolean } ) => (
		<button disabled={ disabled }>{ children }</button>
	),
	Text: ( { children }: { children: React.ReactNode } ) => <p>{ children }</p>,
	LinkButton: ( {
		children,
		href,
		onClick,
	}: {
		children: React.ReactNode;
		href: string;
		onClick?: () => void;
	} ) => (
		<a href={ href } onClick={ onClick }>
			{ children }
		</a>
	),
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getSiteType: () => 'simple',
} ) );

jest.mock( '@automattic/jetpack-analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: jest.fn() } },
} ) );

jest.mock( '../src/settings/script-data', () => ( {
	getNewsletterScriptData: jest.fn(),
} ) );

import analytics from '@automattic/jetpack-analytics';
import { fireEvent, render, screen } from '@testing-library/react';
import { getNewsletterScriptData } from '../src/settings/script-data';
import { EmailDesignSection } from '../src/settings/sections/email-design-section';

const mockedGetScriptData = getNewsletterScriptData as jest.MockedFunction<
	typeof getNewsletterScriptData
>;

const DESIGN_URL = 'https://example.com/wp-admin/themes.php?page=jetpack-email-design';

/**
 * Stub the newsletter script data with a given email design URL.
 *
 * @param emailDesignUrl - The URL the screen reports, or null when it has none.
 */
function mockEmailDesignUrl( emailDesignUrl: string | null ) {
	mockedGetScriptData.mockReturnValue( { emailDesignUrl } as ReturnType<
		typeof getNewsletterScriptData
	> );
}

describe( 'EmailDesignSection', () => {
	it( 'renders nothing on a site whose email design screen is off', () => {
		mockEmailDesignUrl( null );

		const { container } = render( <EmailDesignSection isNewsletterEnabled /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'links to the email design screen the site reported, returning here afterwards', () => {
		mockEmailDesignUrl( DESIGN_URL );

		render( <EmailDesignSection isNewsletterEnabled /> );

		const href = new URL(
			screen.getByRole( 'link', { name: 'Edit email design' } ).getAttribute( 'href' )
		);

		expect( href.origin + href.pathname + '?page=' + href.searchParams.get( 'page' ) ).toBe(
			DESIGN_URL
		);
		expect( href.searchParams.get( 'return' ) ).toBe( window.location.href );
	} );

	it( 'offers a disabled button rather than a live link while the newsletter is off', () => {
		mockEmailDesignUrl( DESIGN_URL );

		render( <EmailDesignSection isNewsletterEnabled={ false } /> );

		expect( screen.queryByRole( 'link', { name: 'Edit email design' } ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Edit email design' } ) ).toBeDisabled();
	} );

	it( 'records a Tracks event when the link is followed', () => {
		mockEmailDesignUrl( DESIGN_URL );

		render( <EmailDesignSection isNewsletterEnabled /> );
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.click( screen.getByRole( 'link', { name: 'Edit email design' } ) );

		expect( analytics.tracks.recordEvent ).toHaveBeenCalledWith(
			'jetpack_newsletter_email_design_click',
			{ site_type: 'simple' }
		);
	} );
} );
