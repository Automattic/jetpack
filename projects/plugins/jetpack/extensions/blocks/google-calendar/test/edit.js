/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import '@testing-library/jest-dom/extend-expect';
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { SandBox } from '@wordpress/components';

// SandBox is mocked to avoid the runtime JS scripts in includes.
jest.mock( '@wordpress/components/build/sandbox', () => ( {
	__esModule: true,
	default: ( props ) => <iframe { ...props } />,
} ) );

/**
 * Internal dependencies
 */
import { GoogleCalendarEdit } from '../edit';
import { isSimpleSite } from '../../../shared/site-type-utils';

// isSimpleSite is mocked simply to check appropriate support link is displayed.
jest.mock( '../../../shared/site-type-utils', () => ( {
	...jest.requireActual( '../../../shared/site-type-utils' ),
	isSimpleSite: jest.fn(),
} ) );

describe( 'GoogleCalendarEdit', () => {
	const defaultClassName = 'wp-block-jetpack-google-calendar';
	const defaultAttributes = {
		url: 'https://calendar.google.com/calendar/embed?src=test.user%40a8c.com&ctz=Pacific%2FAuckland',
		height: '600',
		width: '800',
	};

	const emptyAttributes = {
		url: undefined,
		width: undefined,
		height: undefined,
	};

	const createErrorNotice = jest.fn();
	const removeAllNotices = jest.fn();
	const setAttributes = jest.fn();

	const defaultProps = {
		attributes: { ...defaultAttributes },
		setAttributes,
		clientId: 1,
		isMobile: false,
		className: 'custom-calendar-class',
		isSelected: true,
		name: 'jetpack/google-calendar',
		noticeOperations: {
			removeAllNotices,
			createErrorNotice,
		},
	};

	beforeEach( () => {
		createErrorNotice.mockClear();
		removeAllNotices.mockClear();
		setAttributes.mockClear();
	} );

	test( 'displays placeholder when no url', () => {
		const emptyProps = { ...defaultProps, attributes: emptyAttributes };
		const { container } = render( <GoogleCalendarEdit { ...emptyProps } /> );

		// Check block specific CSS classes are applied.
		expect( container.firstChild ).toHaveClass( defaultProps.className );
		expect( container.querySelector( `.${ defaultClassName }-placeholder-instructions` ) ).toBeInTheDocument();
		expect( container.querySelector( `.${ defaultClassName }-embed-form-editor` ) ).toBeInTheDocument();
		expect( container.querySelector( `.${ defaultClassName }-placeholder-links` ) ).toBeInTheDocument();

		// Check placeholder label, instructions and links.
		const label = screen.getByText( 'Google Calendar' );

		expect( label ).toBeInTheDocument();
		expect( label.querySelector( 'svg' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Enable Permissions for the calendar you want to share' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Paste the embed code you copied from your Google Calendar below' ) ).toBeInTheDocument();

		const supportLink = screen.getByText( 'Learn more' );

		expect( supportLink ).toBeInTheDocument();
		expect( supportLink ).toHaveAttribute( 'href', 'https://jetpack.com/support/jetpack-blocks/google-calendar/' );

		// Check placeholder embed form.
		const textarea = screen.getByPlaceholderText( 'Enter URL or iframe to embed here…' );

		expect( textarea ).toBeInTheDocument();
		expect( textarea ).toHaveClass( 'components-placeholder__input' );
		expect( screen.getByLabelText( 'Google Calendar URL or iframe' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Embed' } ) ).toBeInTheDocument();
	} );

	test( 'renders wpcom support link if simple or atomic site', () => {
		isSimpleSite.mockImplementationOnce( () => true );

		const emptyProps = { ...defaultProps, attributes: emptyAttributes };
		render( <GoogleCalendarEdit { ...emptyProps } /> );

		const url = 'https://en.support.wordpress.com/wordpress-editor/blocks/google-calendar/';
		expect( screen.getByText( 'Learn more' ) ).toHaveAttribute( 'href', url );
	} );

	test( 'displays embedded calendar', () => {
		const { container } = render( <GoogleCalendarEdit { ...defaultProps } /> );
		const html = `<iframe src="${ defaultAttributes.url }" style="border:0" scrolling="no" frameborder="0" height="${ defaultAttributes.height }"></iframe>`;
		const iframe = container.querySelector( 'iframe' );

		expect( iframe ).toBeInTheDocument();
		expect( iframe ).toHaveAttribute( 'html', html );
		expect( container.querySelector( '.block-library-embed__interactive-overlay' ) ).toBeInTheDocument();
	} );
} );
