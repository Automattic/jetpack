/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/extend-expect';

/**
 * Internal dependencies
 */
import GifEdit from '../edit';

describe( 'GifEdit', () => {
	const setAttributesMock = jest.fn();
	const defaultAttributes = {
		align: '',
		caption: '',
		giphyUrl: '',
		searchText: '',
		paddingTop: 0,
	};
	const defaultProps = {
		attributes: {
			...defaultAttributes,
		},
		className: '',
		isSelected: false,
		setAttributes: setAttributesMock,
	};

	// Mock vanilla Ajax call
	const open = jest.fn();
	const send  = jest.fn()
	const setRequestHeader = jest.fn();
	const xhrMockClass = () => ( {
		open,
		send,
		setRequestHeader,
		status: 200,
		responseText: JSON.stringify({
			data: [
					{
						id: '1',
						images: {
							downsized_still: {
								url: 'happy',
							},
							original: {
								height: 10,
								width: 10,
							},
						}
					},
					{
						id: '3',
						images: {
							downsized_still: {
								url: 'day',
							},
							original: {
								height: 10,
								width: 10,
							},
						},
					}
			],
		} )
	} );
	const originalXMLHttpRequest = window.XMLHttpRequest;

	beforeEach( () => {
		setAttributesMock.mockClear();
	} );

	afterAll( () => {
		window.XMLHttpRequest = originalXMLHttpRequest;
	} );

	test( 'loads and displays form by default', () => {
		render( <GifEdit { ...defaultProps } /> );
		expect( screen.getByPlaceholderText( 'Enter search terms, e.g. cat…' ) ).toBeInTheDocument();
	} );

	test( 'loads and displays giphy layout', () => {
		const newProps = {
			...defaultProps,
			attributes: {
				...defaultAttributes,
				searchText: 'puppy',
				giphyUrl: 'https://api.giphy.com/v1/gifs/search?q=puppy&api_key=t1PkR1Vq0mzHueIFBvZSZErgFs9NBmYW&limit=10',
			},
		};

		const { container } = render( <GifEdit { ...newProps } /> );
		expect( container.querySelector( 'figure' ) ).toBeInTheDocument();
	} );

	test( 'performs a remote search using search term', () => {
		window.XMLHttpRequest = jest.fn().mockImplementation( xhrMockClass );
		const { container, rerender } = render( <GifEdit { ...defaultProps } /> );
		userEvent.type( container.querySelector( 'input[type="text"]' ), 'puppy' );
		expect( setAttributesMock ).toHaveBeenCalled();
		userEvent.click( container.querySelector( 'button' ) );
		expect( open ).toHaveBeenCalled();
		expect( send ).toHaveBeenCalled();
	} );
} );
