import { isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoogleCalendarEdit } from '../edit';

jest.mock( '@wordpress/components/build/sandbox', () => ( {
	__esModule: true,
	default: props => <iframe title="Some title" { ...props } />,
} ) );

// isSimpleSite is mocked simply to check appropriate support link is displayed.
jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	...jest.requireActual( '@automattic/jetpack-shared-extension-utils' ),
	isSimpleSite: jest.fn(),
} ) );

describe( 'GoogleCalendarEdit', () => {
	const defaultClassName = 'wp-block-jetpack-google-calendar';
	const defaultAttributes = {
		url:
			'https://calendar.google.com/calendar/embed?src=test.user%40a8c.com&ctz=Pacific%2FAuckland',
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
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		expect( container.firstChild ).toHaveClass( defaultProps.className );
		expect(
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			container.querySelector( `.${ defaultClassName }-placeholder-instructions` )
		).toBeInTheDocument();
		expect(
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			container.querySelector( `.${ defaultClassName }-embed-form-editor` )
		).toBeInTheDocument();
		expect(
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			container.querySelector( `.${ defaultClassName }-placeholder-links` )
		).toBeInTheDocument();

		// Check placeholder label, instructions and links.
		const label = screen.getByText( 'Google Calendar' );

		expect( label ).toBeInTheDocument();
		// eslint-disable-next-line testing-library/no-node-access
		expect( label.querySelector( 'svg' ) ).toBeInTheDocument();
		expect(
			screen.getByText( 'Enable Permissions for the calendar you want to share' )
		).toBeInTheDocument();
		expect(
			screen.getByText( 'Paste the embed code you copied from your Google Calendar below' )
		).toBeInTheDocument();

		const supportLink = screen.getByText( 'Learn more' );

		expect( supportLink ).toBeInTheDocument();
		expect( supportLink ).toHaveAttribute(
			'href',
			'https://jetpack.com/support/jetpack-blocks/google-calendar/'
		);

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

	test( 'handles submitted embed codes', async () => {
		const user = userEvent.setup();
		const emptyProps = { ...defaultProps, attributes: emptyAttributes };
		render( <GoogleCalendarEdit { ...emptyProps } /> );

		const input = screen.getByPlaceholderText( 'Enter URL or iframe to embed here…' );
		const button = screen.getByRole( 'button', { name: 'Embed' } );

		await user.click( input );
		await user.paste( 'invalid-url' );
		await user.click( button );

		const errorMessage =
			"Your calendar couldn't be embedded. Please double check your URL or Embed Code. Please note, you need to use the 'Public URL' or 'Embed Code', the 'Shareable Link' will not work.";

		expect( createErrorNotice ).toHaveBeenCalledWith( errorMessage );
		expect( removeAllNotices ).toHaveBeenCalledTimes( 1 );

		await user.click( input );
		await user.paste( 'https://calendar.google.com/calendar?cid=Z2xlbi5kYXZpZXNAYThjLmNvbQ' );
		await user.click( button );

		const parsedEmbedUrl = 'https://calendar.google.com/calendar/embed?src=glen.davies%40a8c.com';

		expect( setAttributes ).toHaveBeenCalledWith( { url: parsedEmbedUrl } );
		expect( removeAllNotices ).toHaveBeenCalledTimes( 2 );
	} );

	test( 'displays embedded calendar', () => {
		const { container } = render( <GoogleCalendarEdit { ...defaultProps } /> );
		const html = `<iframe src="${ defaultAttributes.url }" style="border:0" scrolling="no" frameborder="0" height="${ defaultAttributes.height }"></iframe>`;
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		const iframe = container.querySelector( 'iframe' );

		expect( iframe ).toBeInTheDocument();
		expect( iframe ).toHaveAttribute( 'html', html );
		expect(
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			container.querySelector( '.block-library-embed__interactive-overlay' )
		).toBeInTheDocument();
	} );

	test( 'omits overlay once clicked', async () => {
		const user = userEvent.setup();
		const deselectedProps = { ...defaultProps, isSelected: false };
		const { container } = render( <GoogleCalendarEdit { ...deselectedProps } /> );
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		const overlay = container.querySelector( '.block-library-embed__interactive-overlay' );

		expect( overlay ).toBeInTheDocument();

		await user.click( overlay );

		expect( overlay ).not.toBeInTheDocument();
	} );
} );
