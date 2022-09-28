import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PinterestEdit } from '../edit';
import useTestPinterestEmbedUrl from '../hooks/use-test-pinterest-embed-url';

jest.mock( '../hooks/use-test-pinterest-embed-url' );
jest.mock( '@wordpress/components/build/sandbox', () => ( {
	__esModule: true,
	default: props => <iframe title="Some name" { ...props } />,
} ) );

describe( 'Pinterest block', () => {
	const defaultAttributes = {
		url: '',
	};

	const setAttributes = jest.fn();
	const removeAllNotices = jest.fn();
	const createErrorNotice = jest.fn();
	const onReplace = jest.fn();
	const defaultProps = {
		attributes: defaultAttributes,
		isSelected: true,
		className: 'burn-baby',
		noticeOperations: {
			removeAllNotices,
			createErrorNotice,
		},
		noticeUI: [ <p key="ahoy">ahoy!</p> ],
		setAttributes,
		onReplace,
	};
	const testUrl = jest.fn();

	beforeEach( () => {
		setAttributes.mockClear();
		onReplace.mockClear();
		removeAllNotices.mockClear();
		createErrorNotice.mockClear();
		useTestPinterestEmbedUrl.mockImplementation( () => ( {
			isFetching: false,
			pinterestUrl: '',
			testUrl,
			hasTestUrlError: false,
		} ) );
	} );

	afterEach( () => {
		useTestPinterestEmbedUrl.mockReset();
	} );

	test( 'show edit form by default', () => {
		render( <PinterestEdit { ...defaultProps } /> );
		expect( screen.getByLabelText( 'Pinterest URL' ) ).toBeInTheDocument();
	} );

	test( 'show loading container when fetching test embed url', () => {
		useTestPinterestEmbedUrl.mockImplementationOnce( () => {
			return {
				isFetching: true,
				pinterestUrl: '',
				testUrl,
				hasTestUrlError: false,
			};
		} );
		render( <PinterestEdit { ...defaultProps } /> );
		expect( screen.getByText( 'Embedding…' ) ).toBeInTheDocument();
	} );

	test( 'fires off a call to test the url', async () => {
		const user = userEvent.setup();
		const { container } = render( <PinterestEdit { ...defaultProps } /> );
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		const form = container.querySelector( 'form' );
		await user.type(
			screen.getByLabelText( 'Pinterest URL' ),
			'https://www.pinterest.com.au/jeanette1952/decor-enamelwarecloisonn%C3%A9glassware/'
		);
		fireEvent.submit( form );
		expect( testUrl ).toHaveBeenCalled();
	} );

	test( 'renders the sandbox with valid pinterest url', () => {
		const newProps = {
			...defaultProps,
			attributes: {
				url: 'https://www.pinterest.com.au/pin/648518415082943575',
			},
		};
		const { container } = render( <PinterestEdit { ...newProps } /> );
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		const wrapperElement = container.querySelector( `.${ defaultProps.className }` );
		expect( wrapperElement ).toBeInTheDocument();
	} );
} );
