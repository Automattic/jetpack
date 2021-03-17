/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import '@testing-library/jest-dom/extend-expect';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';

// Need to mock InnerBlocks before import the CalendlyEdit component as it
// requires the Gutenberg store setup to operate.
jest.mock( '@wordpress/block-editor', () => ( {
	...jest.requireActual( '@wordpress/block-editor' ),
	InnerBlocks: () => <button>Mocked button</button>,
} ) );

/**
 * Internal dependencies
 */
import testEmbedUrl from '../../../shared/test-embed-url';
import CalendlyEdit from '../edit';

jest.mock(
	'../../../shared/test-embed-url',
	() => ( {
		__esModule: true,
		default: jest.fn().mockImplementation( ( url ) => {
			return new Promise( ( resolve, reject ) => {
				url === 'https://calendly.com/invalid-url' ? reject() : resolve( url );
			} );
		} )
	} )
);
describe( 'CalendlyEdit', () => {
	const defaultAttributes = {
		backgroundColor: '#ffffff',
		hideEventTypeDetails: false,
		primaryColor: '#7d7d7d',
		textColor: '#000000',
		style: 'inline',
		url: 'https://calendly.com/username',
	};

	const createErrorNotice = jest.fn();
	const removeAllNotices = jest.fn();
	const setAttributes = jest.fn();

	const defaultProps = {
		attributes: defaultAttributes,
		setAttributes,
		className: '',
		clientId: 1,
		name: 'jetpack/calendly',
		noticeOperations: {
			removeAllNotices,
			createErrorNotice,
		},
	};

	const propsWithoutUrl = {
		...defaultProps,
		attributes: {
			...defaultAttributes,
			url: undefined,
		},
	};

	beforeEach( () => {
		createErrorNotice.mockClear();
		removeAllNotices.mockClear();
		setAttributes.mockClear();
	} );

	test( 'validates block attributes', () => {
		const attributes = { ...defaultAttributes, invalid: true };

		render( <CalendlyEdit { ...{ ...defaultProps, attributes } } /> );

		expect( setAttributes ).toHaveBeenCalledWith( defaultAttributes );
	} );

	test.skip( 'set undefined url and displays error when invalid url supplied', async () => {
		const attributes = { ...defaultAttributes, url: 'https://calendly.com/invalid-url' };
		render( <CalendlyEdit { ...{ ...defaultProps, attributes } } /> );

		expect( testEmbedUrl ).toHaveBeenCalledWith( attributes.url, expect.anything() );

		// Render is supposed to be wrapped in an act call. How do I wait for
		// testEmbedUrl promise to resolve to check that the appropriate
		// error notice functions were called and url attribute cleared?

		expect( setAttributes ).toHaveBeenCalledWith( { url: undefined } );
		expect( removeAllNotices ).toHaveBeenCalled();
		expect( createErrorNotice ).toHaveBeenCalled();
	} );

	describe( 'parseEmbedCode', () => {
		test( 'displays error notice when empty embed url submitted', () => {
			render( <CalendlyEdit { ...propsWithoutUrl } /> );

			userEvent.click( screen.getByRole( 'button', { name: 'Embed' } ) );

			expect( removeAllNotices ).toHaveBeenCalled();
			expect( createErrorNotice ).toHaveBeenCalled();
		} );

		test.skip( 'displays error notice when updated embed code fails to parse', () => {
			render( <CalendlyEdit { ...propsWithoutUrl } /> );

			// I'm getting something wrong here as well. I get a passing test
			// although there is a warning/error printed stating a component is
			// changing an uncontrolled input to a controlled input.

			// fireEvent.change( screen.getByRole( 'textbox' ), { target: { value: 'invalid-url' } } );
			// userEvent.type( screen.getByPlaceholderText( 'Calendly web address or embed code…' ), 'invalid-url' );
			// screen.getByRole( 'textbox' ).value = 'invalid-url';
			userEvent.type( screen.getByRole( 'textbox' ), 'invalid-url' );
			userEvent.click( screen.getByRole( 'button', { name: 'Embed' } ) );

			expect( removeAllNotices ).toHaveBeenCalled();
			expect( createErrorNotice ).toHaveBeenCalled();
		} );

		test.skip( 'updates inner button block when new link embed code parsed', () => {
			// TODO: Work out how to test this dispatched action.
		} );

		test.skip( 'parsed embed code is tested before updating attributes', () => {
			render( <CalendlyEdit { ...propsWithoutUrl } /> );

			// Same uncontrolled to controlled input issue.
			// In addition parseEmbedCode sets state and should be wrapped in a
			// call to act(). Not sure how to approach this.

			// fireEvent.change( screen.getByRole( 'textbox' ), { target: { value: 'invalid-url' } } );
			// userEvent.type( screen.getByPlaceholderText( 'Calendly web address or embed code…' ), 'invalid-url' );
			// screen.getByRole( 'textbox' ).value = 'invalid-url';
			userEvent.type( screen.getByRole( 'textbox' ), 'https://calendly.com/valid-url' );
			userEvent.click( screen.getByRole( 'button', { name: 'Embed' } ) );

			expect( testEmbedUrl ).toHaveBeenCalledWith( 'https://calendly.com/valid-url', expect.anything() );
		} );
	} );

	test.skip( 'displays a spinner while the block is embedding', () => {
		// When internal state is set to resolving url, spinner should be shown.
		// The setter for this internal state is passed to `testEmbedUrl`
		// where it is set to true until the promise is resolved.
	} );

	test( 'renders inline preview with iframe component', () => {
		render( <CalendlyEdit { ...defaultProps } /> );

		const iframe = screen.getByTitle( 'Calendly' );

		expect( iframe ).toBeInTheDocument();
		expect( iframe.parentElement ).toHaveClass( 'calendly-style-inline' );
		expect( iframe.previousElementSibling ).toHaveClass( 'wp-block-jetpack-calendly-overlay' );
	} );

	test( 'renders button preview when link style selected', () => {
		const attributes = { ...defaultAttributes, style: 'link' };
		render( <CalendlyEdit { ...{ ...defaultProps, attributes } } /> );

		expect( screen.getByRole( 'button', { name: 'Mocked button' } ) ).toBeInTheDocument();
	} );

	test.skip( 'displays placeholder when no url', () => {
		render( <CalendlyEdit { ...propsWithoutUrl } /> );

		expect( screen.getByText( 'Calendly' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Enter your Calendly web address or embed code below.' ) ).toBeInTheDocument();
		expect( screen.getByPlaceholderText( 'Calendly web address or embed code…' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Embed' ) ).toBeInTheDocument();

		const link = screen.getByText( 'Need help finding your embed code?' );

		expect( link ).toBeInTheDocument();
		expect( link.parentElement ).toHaveClass( 'wp-block-jetpack-calendly-learn-more' );
	} );

	test.skip( 'displays placeholder when url present but it is being edited', () => {
		render( <CalendlyEdit { ...defaultProps } /> );

		// How do I update state in a non-frowned upon way? Should I even test this?
		// I'd like to because the state will alter how this behaves for the user.
		// Without rendering the block toolbar controls don't think I could
		// simulate via actions made by a user.
		expect( screen.getByText( 'Enter your Calendly web address or embed code below.' ) ).toBeInTheDocument();
	} );
} );
