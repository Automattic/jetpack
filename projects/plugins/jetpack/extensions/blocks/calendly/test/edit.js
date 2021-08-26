/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import '@testing-library/jest-dom/extend-expect';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';

// this is necessary because block editor store becomes unregistered during jest initialization
import { register } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
register( blockEditorStore );

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
import { CalendlyEdit } from '../edit';

jest.mock( '../../../shared/test-embed-url', () => ( {
	__esModule: true,
	default: jest.fn().mockImplementation( ( url, setIsResolvingUrl ) => {
		setIsResolvingUrl( true );
		return new Promise( ( resolve, reject ) => {
			if ( url === 'https://calendly.com/username' ) {
				setIsResolvingUrl( false );
			}
			url === 'https://calendly.com/invalid-url' ? reject() : resolve( url );
		} );
	} ),
} ) );

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
			url: '',
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

	test( 'set undefined url and displays error when invalid url supplied', async () => {
		const attributes = { ...defaultAttributes, url: 'https://calendly.com/invalid-url' };
		render( <CalendlyEdit { ...{ ...defaultProps, attributes } } /> );

		expect( testEmbedUrl ).toHaveBeenCalledWith( attributes.url, expect.anything() );

		await waitFor( () => expect( setAttributes ).toHaveBeenCalledWith( { url: undefined } ) );
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

		test( 'displays error notice when updated embed code fails to parse', () => {
			render( <CalendlyEdit { ...propsWithoutUrl } /> );

			userEvent.paste(
				screen.getByPlaceholderText( 'Calendly web address or embed code…' ),
				'invalid-url'
			);
			userEvent.click( screen.getByRole( 'button', { name: 'Embed' } ) );

			expect( removeAllNotices ).toHaveBeenCalled();
			expect( createErrorNotice ).toHaveBeenCalled();
		} );

		test( 'parsed embed code is tested before updating attributes', async () => {
			render( <CalendlyEdit { ...propsWithoutUrl } /> );

			userEvent.type( screen.getByRole( 'textbox' ), 'https://calendly.com/valid-url' );
			userEvent.click( screen.getByRole( 'button', { name: 'Embed' } ) );

			await waitFor( () =>
				expect( testEmbedUrl ).toHaveBeenCalledWith(
					'https://calendly.com/valid-url',
					expect.anything()
				)
			);
		} );
	} );

	test( 'displays a spinner while the block is embedding', async () => {
		const attributes = { ...defaultAttributes, url: 'https://calendly.com/invalid-url' };
		render( <CalendlyEdit { ...{ ...defaultProps, attributes } } /> );

		await waitFor( () => expect( screen.getByText( 'Embedding…' ) ).toBeInTheDocument() );
	} );

	test( 'renders inline preview with iframe component', async () => {
		render( <CalendlyEdit { ...defaultProps } /> );

		let iframe;
		await waitFor( () => ( iframe = screen.getByTitle( 'Calendly' ) ) );

		expect( iframe ).toBeInTheDocument();
		expect( iframe.parentElement ).toHaveClass( 'calendly-style-inline' );
		expect( iframe.previousElementSibling ).toHaveClass( 'wp-block-jetpack-calendly-overlay' );
	} );

	test( 'renders button preview when link style selected', () => {
		const attributes = { ...defaultAttributes, style: 'link' };
		render( <CalendlyEdit { ...{ ...defaultProps, attributes } } /> );

		expect( screen.getByRole( 'button', { name: 'Mocked button' } ) ).toBeInTheDocument();
	} );

	test( 'displays placeholder when no url', () => {
		render( <CalendlyEdit { ...propsWithoutUrl } /> );

		expect( screen.getByText( 'Calendly' ) ).toBeInTheDocument();
		expect(
			screen.getByText( 'Enter your Calendly web address or embed code below.' )
		).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText( 'Calendly web address or embed code…' )
		).toBeInTheDocument();
		expect( screen.getByText( 'Embed' ) ).toBeInTheDocument();

		const link = screen.getByText( 'Need help finding your embed code?' );

		expect( link ).toBeInTheDocument();
		expect( link.parentElement ).toHaveClass( 'wp-block-jetpack-calendly-learn-more' );
	} );
} );
