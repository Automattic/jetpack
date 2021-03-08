/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import { render, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

/**
 * Internal dependencies
 */
import GifEdit from '../edit';
import { getUrl } from '../utils';

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

const originalFetch = window.fetch;

/**
 * Mock return value for a successful fetch JSON return value.
 *
 * @return {Promise} Mock return value.
 */
const GIPHY_RESPONSE = {
	data: [
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
			}
		}
	]
};
const RESOLVED_FETCH_PROMISE = Promise.resolve( GIPHY_RESPONSE );
const DEFAULT_FETCH_MOCK_RETURN = Promise.resolve( {
	status: 200,
	ok: true,
	json: () => RESOLVED_FETCH_PROMISE,
} );

describe( 'GifEdit', () => {
	beforeEach( () => {
		window.fetch = jest.fn();
		window.fetch.mockReturnValue( DEFAULT_FETCH_MOCK_RETURN );
	} );

	afterEach( async () => {
		await act( () => GIPHY_RESPONSE );
		setAttributes.mockReset();
	} );

	afterAll( () => {
		window.fetch = originalFetch;
	} );

	test( 'adds class names', () => {
		const { container } = render( <GifEdit { ...defaultProps }  /> );
		expect( container.querySelector( `.${ defaultProps.className }.align${ defaultProps.attributes.align }` ) ).toBeInTheDocument();
	} );

	test( 'loads default search form and not the gallery where there is no giphy URL', () => {
		const { container } = render( <GifEdit { ...defaultProps }  /> );
		expect( container.querySelector( '.wp-block-jetpack-gif_placeholder' ) ).toBeInTheDocument();
		expect( container.querySelector( 'figure' ) ).not.toBeInTheDocument();
	} );

/*	test( 'calls API and returns giphy images', () => {
		const newProps = {
			...defaultProps,
			attributes: {
				...defaultAttributes,
				searchText: 'sausage roll',
			},
		};
		const { container } = render( <GifEdit { ...newProps } /> );
		fireEvent.submit( container.querySelector( 'form' ) );
		expect( window.fetch ).toHaveBeenCalledWith( getUrl( newProps.attributes.searchText ) );
	} );*/
} );
