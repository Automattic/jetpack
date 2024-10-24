import { fireEvent, render } from '@testing-library/react';
import GifEdit from '../edit';
import useFetchTumblrData from '../hooks/use-fetch-tumblr-data';
import { getPaddingTop, getUrl } from '../utils';

const setAttributes = jest.fn();

const defaultAttributes = {
	align: 'left',
	caption: '',
	gifUrl: '',
	searchText: '',
	paddingTop: 0,
};

const defaultProps = {
	attributes: defaultAttributes,
	className: 'noodles',
	setAttributes,
	isSelected: false,
};

const TUMBLR_DATA = [
	{
		media_key: '9',
		media: [ { url: 'pony', poster: { url: 'chips' }, height: 10, width: 10 } ],
		attribution: { blog: { name: 'Tumblr Blog' }, url: 'https://tumblr.com' },
	},
	{
		media_key: '99',
		media: [ { url: 'horsey', poster: { url: 'fish' }, height: 12, width: 12 } ],
		attribution: { blog: { name: 'Another Blog' }, url: 'https://tumblr.com' },
	},
];

const fetchTumblrData = jest.fn();

jest.mock( './../hooks/use-fetch-tumblr-data' );

describe( 'GifEdit', () => {
	beforeEach( () => {
		useFetchTumblrData.mockImplementation( () => {
			return {
				fetchTumblrData,
				tumblrData: [],
				isFetching: false,
			};
		} );
	} );

	afterEach( async () => {
		fetchTumblrData.mockReset();
		setAttributes.mockReset();
		useFetchTumblrData.mockReset();
	} );

	test( 'adds class names', () => {
		const { container } = render( <GifEdit { ...defaultProps } /> );
		expect(
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			container.querySelector( `.align${ defaultProps.attributes.align }` )
		).toBeInTheDocument();
	} );

	test( 'loads default search form and not the gallery where there is no gif URL', () => {
		const { container } = render( <GifEdit { ...defaultProps } /> );
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		expect( container.querySelector( '.wp-block-jetpack-gif_placeholder' ) ).toBeInTheDocument();
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		expect( container.querySelector( 'figure' ) ).not.toBeInTheDocument();
	} );

	test( 'calls API and returns tumblr images', async () => {
		useFetchTumblrData.mockImplementationOnce( () => {
			return {
				fetchTumblrData,
				tumblrData: TUMBLR_DATA,
				isFetching: false,
			};
		} );
		const newProps = {
			...defaultProps,
			isSelected: true,
			attributes: {
				...defaultAttributes,
				gifUrl: 'https://itsalong.way/to/the/top/if/you/want',
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

		expect( fetchTumblrData ).toHaveBeenCalledWith(
			await getUrl( newProps.attributes.searchText )
		);
		expect( setAttributes.mock.calls[ 0 ][ 0 ] ).toStrictEqual( {
			gifUrl: TUMBLR_DATA[ 0 ].media[ 0 ].url,
			paddingTop: getPaddingTop( TUMBLR_DATA[ 0 ].media[ 0 ] ),
			attributionUrl: TUMBLR_DATA[ 0 ].attribution.url,
			attributionName: TUMBLR_DATA[ 0 ].attribution.blog.name,
		} );

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		expect( container.querySelector( 'figure' ) ).toBeInTheDocument();
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		expect( container.querySelector( 'figcaption' ) ).toBeInTheDocument();
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		expect( container.querySelector( '.wp-block-jetpack-gif-wrapper img' ) ).toBeInTheDocument();
		expect(
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			container.querySelectorAll( '.wp-block-jetpack-gif_thumbnail-container' )
		).toHaveLength( 2 );
	} );

	test( 'renders iframe for legacy Giphy block', () => {
		useFetchTumblrData.mockImplementation( () => {
			return {
				fetchTumblrData: jest.fn(),
				tumblrData: [],
				isFetching: false,
			};
		} );

		const propsWithGiphyUrl = {
			attributes: {
				align: 'center',
				caption: '',
				giphyUrl: 'https://giphy.com/embed/some-giphy-id',
				searchText: '',
				paddingTop: '56.2%',
			},
			setAttributes,
			isSelected: false,
		};

		const { container } = render( <GifEdit { ...propsWithGiphyUrl } /> );

		// Check if the iframe is rendered
		expect(
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			container.querySelector( 'iframe[src="https://giphy.com/embed/some-giphy-id"]' )
		).toBeInTheDocument();

		// Ensure fetchTumblrData is not called
		expect( useFetchTumblrData().fetchTumblrData ).not.toHaveBeenCalled();
	} );
} );
