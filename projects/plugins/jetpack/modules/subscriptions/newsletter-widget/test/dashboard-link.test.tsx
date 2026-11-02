import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link } from '@wordpress/ui';
import { DashboardLink } from '../src/components/dashboard-link';
import { TRACKS_EVENT_NAME_PREFIX } from '../src/constants';

jest.mock( '@wordpress/ui', () => ( {
	Link: jest.fn( ( { href, children, onClick } ) => (
		<a href={ href } onClick={ onClick }>
			{ children }
		</a>
	) ),
} ) );

describe( 'DashboardLink', () => {
	const testHref = 'https://example.com';
	const testText = 'Click me';
	const testEventName = 'test_click';
	const mockRecordEvent = jest.fn();
	const tracks = { recordEvent: mockRecordEvent };

	beforeEach( () => {
		mockRecordEvent.mockClear();
		jest.mocked( Link ).mockClear();
	} );

	it( 'renders as a regular anchor tag for links that stay within the platform', () => {
		render(
			<DashboardLink internal href={ testHref } eventName={ testEventName } tracks={ tracks }>
				{ testText }
			</DashboardLink>
		);

		const link = screen.getByRole( 'link', { name: testText } );
		expect( link.tagName ).toBe( 'A' );
		expect( link ).toHaveAttribute( 'href', testHref );
		expect( link ).not.toHaveAttribute( 'target' );
		expect( Link ).not.toHaveBeenCalled();
	} );

	it( 'passes openInNewTab for external links', () => {
		render(
			<DashboardLink
				internal={ false }
				href={ testHref }
				eventName={ testEventName }
				tracks={ tracks }
			>
				{ testText }
			</DashboardLink>
		);

		expect( jest.mocked( Link ).mock.calls[ 0 ][ 0 ] ).toEqual(
			expect.objectContaining( {
				href: testHref,
				openInNewTab: true,
				children: testText,
			} )
		);
	} );

	it( 'renders without text content', () => {
		render(
			<DashboardLink internal href={ testHref } eventName={ testEventName } tracks={ tracks } />
		);

		expect( screen.getByRole( 'link' ) ).toHaveAttribute( 'href', testHref );
		expect( screen.getByRole( 'link' ) ).not.toHaveTextContent( /\S/ );
	} );

	it( 'records the click event and not a view', async () => {
		const user = userEvent.setup();
		render(
			<DashboardLink internal href={ testHref } eventName={ testEventName } tracks={ tracks }>
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
