import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { ExternalLink } from '@wordpress/components';
import { DashboardLink } from '../src/components/dashboard-link';
import { TRACKS_EVENT_NAME_PREFIX } from '../src/constants';

// Mock WordPress element hooks
jest.mock( '@wordpress/element', () => ( {
	...jest.requireActual( '@wordpress/element' ),
	useEffect: jest.fn( cb => cb() ), // Execute the callback immediately
} ) );

// Mock the useAnalytics hook
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
		const link = DashboardLink( true, testHref, testEventName, testText );
		expect( link.type ).toBe( 'a' );
		expect( link.props.href ).toBe( testHref );
		expect( link.props.children ).toBe( testText );
	} );

	it( 'renders as ExternalLink for links that point to external resources', () => {
		const link = DashboardLink( false, testHref, testEventName, testText );
		expect( link.type ).toBe( ExternalLink );
		expect( link.props.href ).toBe( testHref );
		expect( link.props.children ).toBe( testText );
	} );

	it( 'handles not being passed a text prop', () => {
		const link = DashboardLink( true, testHref, testEventName );
		expect( link.props.children ).toBeUndefined();
	} );

	it( 'sets up click tracking with the provided event name', () => {
		const link = DashboardLink( true, testHref, testEventName, testText );
		expect( link.props.onClick ).toBeDefined();

		// Clear any previous calls (like the view event)
		mockRecordEvent.mockClear();

		// Simulate clicking the link
		link.props.onClick();

		// Verify that the tracking event was recorded with empty object as second parameter
		expect( mockRecordEvent ).toHaveBeenCalledWith(
			`${ TRACKS_EVENT_NAME_PREFIX }${ testEventName }`,
			{}
		);
	} );

	it( 'records view event on mount', () => {
		DashboardLink( true, testHref, testEventName, testText );
		expect( mockRecordEvent ).toHaveBeenCalledWith( `${ TRACKS_EVENT_NAME_PREFIX }_view` );
	} );
} );
