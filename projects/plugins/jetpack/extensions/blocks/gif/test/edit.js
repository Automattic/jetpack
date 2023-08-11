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
		embed_url: 'pony',
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
		embed_url: 'horsey',
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
			container.querySelector(
				`.${ defaultProps.className }.align${ defaultProps.attributes.align }`
			)
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
		useFetchGiphyData.mockImplementationOnce( () => {
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
				giphyUrl: 'https://itsalong.way/to/the/top/if/you/want',
				searchText: 'a sausage roll',
			},
		};
		const { container } = render( <GifEdit { ...newProps } /> );

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		expect( container.querySelector( 'form input' ).value ).toEqual(
			newProps.attributes.searchText
		);

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		fireEvent.submit( container.querySelector( 'form' ) );

		expect( fetchGiphyData ).toHaveBeenCalledWith( getUrl( newProps.attributes.searchText ) );
		expect( setAttributes.mock.calls[ 0 ][ 0 ] ).toStrictEqual( {
			giphyUrl: getEmbedUrl( GIPHY_DATA[ 0 ] ),
			paddingTop: getPaddingTop( GIPHY_DATA[ 0 ] ),
		} );

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		expect( container.querySelector( 'figure' ) ).toBeInTheDocument();
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		expect( container.querySelector( 'figcaption' ) ).toBeInTheDocument();
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		expect( container.querySelector( '.wp-block-jetpack-gif-wrapper iframe' ) ).toBeInTheDocument();
		expect(
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			container.querySelectorAll( '.wp-block-jetpack-gif_thumbnail-container' )
		).toHaveLength( 2 );
	} );
} );
