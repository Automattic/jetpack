import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardLink } from '../src/components/dashboard-link';
import { TRACKS_EVENT_NAME_PREFIX } from '../src/constants';

jest.mock( '@wordpress/ui', () => ( {
	Link: ( { href, children, openInNewTab, onClick } ) => (
		<a
			href={ href }
			target={ openInNewTab ? '_blank' : undefined }
			onClick={ onClick }
			rel="noreferrer"
		>
			{ children }
		</a>
	),
} ) );

jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	useAnalytics: jest.fn(),
} ) );

describe( 'DashboardLink', () => {
	const testHref = 'https://example.com';
	const testText = 'Click me';
	const testEventName = 'test_click';
	const mockRecordEvent = jest.fn();

	beforeEach( () => {
		( useAnalytics as jest.Mock ).mockReturnValue( {
			tracks: { recordEvent: mockRecordEvent },
		} );
		mockRecordEvent.mockClear();
	} );

	it( 'renders as a regular anchor tag for links that stay within the platform', () => {
		render(
			<DashboardLink internal href={ testHref } eventName={ testEventName }>
				{ testText }
			</DashboardLink>
		);

		const link = screen.getByRole( 'link', { name: testText } );
		expect( link.tagName ).toBe( 'A' );
		expect( link ).toHaveAttribute( 'href', testHref );
		expect( link ).not.toHaveAttribute( 'target' );
	} );

	it( 'renders external links so they open in a new tab', () => {
		render(
			<DashboardLink internal={ false } href={ testHref } eventName={ testEventName }>
				{ testText }
			</DashboardLink>
		);

		const link = screen.getByRole( 'link', { name: testText } );
		expect( link ).toHaveAttribute( 'href', testHref );
		expect( link ).toHaveAttribute( 'target', '_blank' );
	} );

	it( 'renders without text content', () => {
		render( <DashboardLink internal href={ testHref } eventName={ testEventName } /> );

		expect( screen.getByRole( 'link' ) ).toHaveAttribute( 'href', testHref );
		expect( screen.getByRole( 'link' ) ).not.toHaveTextContent( /\S/ );
	} );

	it( 'records the click event and not a view', async () => {
		const user = userEvent.setup();
		render(
			<DashboardLink internal href={ testHref } eventName={ testEventName }>
				{ testText }
			</DashboardLink>
		);

		expect( mockRecordEvent ).not.toHaveBeenCalled();

		const link = screen.getByRole( 'link', { name: testText } );
		// jsdom reports an error if the click follows the href.
		link.addEventListener( 'click', event => event.preventDefault() );
		await user.click( link );

		expect( mockRecordEvent ).toHaveBeenCalledTimes( 1 );
		expect( mockRecordEvent ).toHaveBeenCalledWith(
			`${ TRACKS_EVENT_NAME_PREFIX }${ testEventName }`,
			{}
		);
	} );
} );
