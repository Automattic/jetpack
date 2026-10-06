import { render, fireEvent } from '@testing-library/react';
import GifEdit from '../edit';
import useFetchGiphyData from '../hooks/use-fetch-giphy-data';
import { getUrl, getPaddingTop, getEmbedUrl } from '../utils';

const setAttributes = jest.fn();

const defaultAttributes = {
	align: 'left',
	caption: '',
	giphyUrl: '',
	searchText: '',
	paddingTop: 0,
};

const defaultProps = {
	attributes: defaultAttributes,
	className: 'noodles',
	setAttributes,
	isSelected: false,
};

const GIPHY_DATA = [
	{
		id: '9',
		embed_url: 'https://giphy.com/embed/9',
		images: {
			downsized_still: {
				url: 'chips',
			},
			original: {
				height: 10,
				width: 10,
			},
		},
	},
	{
		id: '99',
		embed_url: 'https://giphy.com/embed/99',
		images: {
			downsized_still: {
				url: 'fish',
			},
			original: {
				height: 12,
				width: 12,
			},
		},
	},
];

const fetchGiphyData = jest.fn();

jest.mock( './../hooks/use-fetch-giphy-data' );

describe( 'GifEdit', () => {
	beforeEach( () => {
		useFetchGiphyData.mockImplementation( () => {
			return {
				fetchGiphyData,
				giphyData: [],
				isFetching: false,
			};
		} );
	} );

	afterEach( async () => {
		fetchGiphyData.mockReset();
		setAttributes.mockReset();
		useFetchGiphyData.mockReset();
	} );

	test( 'adds class names', () => {
		const { container } = render( <GifEdit { ...defaultProps } /> );
		expect(
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			container.querySelector( `.align${ defaultProps.attributes.align }` )
		).toBeInTheDocument();
	} );

	test( 'loads default search form and not the gallery where there is no giphy URL', () => {
		const { container } = render( <GifEdit { ...defaultProps } /> );
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		expect( container.querySelector( '.wp-block-jetpack-gif_placeholder' ) ).toBeInTheDocument();
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		expect( container.querySelector( 'figure' ) ).not.toBeInTheDocument();
	} );

	test( 'calls API and returns giphy images', async () => {
		useFetchGiphyData.mockImplementation( () => {
			return {
				fetchGiphyData,
				giphyData: GIPHY_DATA,
				isFetching: false,
			};
		} );
		const newProps = {
			...defaultProps,
			isSelected: true,
			attributes: {
				...defaultAttributes,
				searchText: 'a sausage roll',
			},
		};
		const { container, rerender } = render( <GifEdit { ...newProps } /> );

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		expect( container.querySelector( 'form input' ).value ).toEqual(
			newProps.attributes.searchText
		);

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		fireEvent.submit( container.querySelector( 'form' ) );

		const url = await getUrl( newProps.attributes.searchText );
		expect( fetchGiphyData ).toHaveBeenCalledWith( url );
		expect( setAttributes.mock.calls[ 0 ][ 0 ] ).toStrictEqual( {
			giphyUrl: getEmbedUrl( GIPHY_DATA[ 0 ] ),
			paddingTop: getPaddingTop( GIPHY_DATA[ 0 ] ),
		} );

		const updatedAttributes = setAttributes.mock.calls[ 0 ][ 0 ];

		rerender(
			<GifEdit
				{ ...newProps }
				attributes={ {
					...newProps.attributes,
					...updatedAttributes,
				} }
			/>
		);

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		expect( container.querySelector( 'figure' ) ).toBeInTheDocument();
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		expect( container.querySelector( 'figcaption' ) ).toBeInTheDocument();
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		expect( container.querySelector( '.wp-block-jetpack-gif-wrapper iframe' ) ).toBeInTheDocument();
	} );

	describe( 'does not embed stored urls that are not allowed', () => {
		test.each( [
			[ 'javascript scheme', 'javascript:void(0)' ],
			[ 'mixed-case javascript scheme', 'JavaScript:void(0)' ],
			[ 'data scheme', 'data:text/html,hello' ],
			[ 'non-Giphy https host', 'https://other.example.com/embed/9' ],
			[ 'longer host with the same prefix', 'https://giphy.com.other.example.com/embed/9' ],
			[ 'not HTTPS', 'http://giphy.com/embed/9' ],
		] )( 'does not render an iframe for %s', ( _label, giphyUrl ) => {
			const newProps = { ...defaultProps, attributes: { ...defaultAttributes, giphyUrl } };
			const { container } = render( <GifEdit { ...newProps } /> );

			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			expect( container.querySelector( 'iframe' ) ).not.toBeInTheDocument();
			expect(
				// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
				container.querySelector( '.wp-block-jetpack-gif_placeholder' )
			).toBeInTheDocument();
		} );
	} );

	test( 'does not reset giphyUrl if giphyUrl is already set', () => {
		useFetchGiphyData.mockImplementationOnce( () => {
			return {
				fetchGiphyData,
				giphyData: GIPHY_DATA,
				isFetching: false,
			};
		} );
		const newProps = {
			...defaultProps,
			attributes: {
				...defaultAttributes,
				giphyUrl: 'https://existing.url/giphy',
			},
		};
		render( <GifEdit { ...newProps } /> );

		// setAttributes should not be called since giphyUrl is already set
		expect( setAttributes ).not.toHaveBeenCalled();
	} );

	test( 'resets giphyUrl when giphyData is available and giphyUrl is not set', () => {
		useFetchGiphyData.mockImplementationOnce( () => {
			return {
				fetchGiphyData,
				giphyData: GIPHY_DATA,
				isFetching: false,
			};
		} );
		const newProps = {
			...defaultProps,
			attributes: {
				...defaultAttributes,
				giphyUrl: '', // No giphyUrl set
			},
		};
		render( <GifEdit { ...newProps } /> );

		// setAttributes should be called with the first giphy result
		expect( setAttributes ).toHaveBeenCalledWith( {
			giphyUrl: getEmbedUrl( GIPHY_DATA[ 0 ] ),
			paddingTop: getPaddingTop( GIPHY_DATA[ 0 ] ),
		} );
	} );
} );
