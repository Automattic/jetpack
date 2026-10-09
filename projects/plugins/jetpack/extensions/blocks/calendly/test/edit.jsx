import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import testEmbedUrl from '../../../shared/test-embed-url';
import { CalendlyEdit } from '../edit';

jest.mock( '@wordpress/block-editor', () => ( {
	...jest.requireActual( '@wordpress/block-editor' ),
	InnerBlocks: () => <button>Mocked button</button>,
} ) );

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
		testEmbedUrl.mockClear();
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
		test( 'displays error notice when empty embed url submitted', async () => {
			const user = userEvent.setup();
			render( <CalendlyEdit { ...propsWithoutUrl } /> );

			await user.click( screen.getByRole( 'button', { name: 'Embed' } ) );

			expect( removeAllNotices ).toHaveBeenCalled();
			expect( createErrorNotice ).toHaveBeenCalled();
		} );

		test( 'displays error notice when updated embed code fails to parse', async () => {
			const user = userEvent.setup();
			render( <CalendlyEdit { ...propsWithoutUrl } /> );

			await user.click( screen.getByPlaceholderText( 'Calendly web address or embed code…' ) );
			await user.paste( 'invalid-url' );
			await user.click( screen.getByRole( 'button', { name: 'Embed' } ) );

			expect( removeAllNotices ).toHaveBeenCalled();
			expect( createErrorNotice ).toHaveBeenCalled();
		} );

		// The embed-code regex accepts this host; the allowlist does not.
		test( 'displays error notice and skips the server check for a host outside the allowlist', async () => {
			const user = userEvent.setup();
			render( <CalendlyEdit { ...propsWithoutUrl } /> );

			await user.click( screen.getByPlaceholderText( 'Calendly web address or embed code…' ) );
			await user.paste( 'https://calendly.com.other.example.com/username' );
			await user.click( screen.getByRole( 'button', { name: 'Embed' } ) );

			expect( createErrorNotice ).toHaveBeenCalled();
			expect( testEmbedUrl ).not.toHaveBeenCalled();
		} );

		test( 'parsed embed code is tested before updating attributes', async () => {
			const user = userEvent.setup();
			render( <CalendlyEdit { ...propsWithoutUrl } /> );

			await user.type( screen.getByRole( 'textbox' ), 'https://calendly.com/valid-url' );
			await user.click( screen.getByRole( 'button', { name: 'Embed' } ) );

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

		await expect( screen.findByText( 'Embedding…' ) ).resolves.toBeInTheDocument();
	} );

	test( 'renders inline preview with iframe component', async () => {
		render( <CalendlyEdit { ...defaultProps } /> );

		let iframe;
		await waitFor( () => ( iframe = screen.getByTitle( 'Calendly' ) ) );

		expect( iframe ).toBeInTheDocument();
		// eslint-disable-next-line testing-library/no-node-access
		expect( iframe.parentElement ).toHaveClass( 'calendly-style-inline' );
	} );

	test( 'renders button preview when link style selected', () => {
		const attributes = { ...defaultAttributes, style: 'link' };
		render( <CalendlyEdit { ...{ ...defaultProps, attributes } } /> );

		expect( screen.getByRole( 'button', { name: 'Mocked button' } ) ).toBeInTheDocument();
	} );

	test( 'displays placeholder when no url', () => {
		const { container } = render( <CalendlyEdit { ...propsWithoutUrl } /> );

		expect( screen.getByText( 'Calendly' ) ).toBeInTheDocument();
		expect(
			within( container ).getByText( 'Enter your Calendly web address or embed code below.' )
		).toBeInTheDocument();
		expect(
			screen.getByPlaceholderText( 'Calendly web address or embed code…' )
		).toBeInTheDocument();
		expect( screen.getByText( 'Embed' ) ).toBeInTheDocument();

		const link = screen.getByRole( 'link', {
			name: 'Need help finding your embed code?(opens in a new tab)',
		} );

		expect( link ).toBeInTheDocument();
		// eslint-disable-next-line testing-library/no-node-access
		expect( link.parentElement ).toHaveClass( 'wp-block-jetpack-calendly-learn-more' );
	} );

	describe( 'does not embed stored urls that are not allowed', () => {
		test.each( [
			[ 'javascript scheme', 'javascript:void(0)' ],
			[ 'mixed-case javascript scheme', 'JavaScript:void(0)' ],
			[ 'leading-whitespace javascript scheme', '  javascript:void(0)' ],
			[ 'data scheme', 'data:text/html,<p>hello</p>' ],
			[ 'non-Calendly https host', 'https://other.example.com/username' ],
			[ 'longer host with the same prefix', 'https://calendly.com.other.example.com/username' ],
		] )( 'does not render an iframe for %s', async ( _label, url ) => {
			const attributes = { ...defaultAttributes, url };
			render( <CalendlyEdit { ...{ ...defaultProps, attributes } } /> );

			expect( screen.queryByTitle( 'Calendly' ) ).not.toBeInTheDocument();
			expect(
				screen.getByPlaceholderText( 'Calendly web address or embed code…' )
			).toBeInTheDocument();
			// The value is rejected without the server round-trip.
			expect( testEmbedUrl ).not.toHaveBeenCalledWith( url, expect.anything() );
			await waitFor( () => expect( setAttributes ).toHaveBeenCalledWith( { url: undefined } ) );
			expect( createErrorNotice ).toHaveBeenCalled();
		} );
	} );
} );
