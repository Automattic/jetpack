/* eslint-disable react/jsx-no-bind */
/**
 * Tests for the product image list and the one image a variant option carries.
 *
 * @package
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductImages, {
	OptionImage,
} from '../../src/paypal-payment-buttons/components/product-images';
import { forgetUploadedImages } from '../../src/paypal-payment-buttons/hooks/use-image-upload';
const apiFetch = require( '@wordpress/api-fetch' );

jest.mock( '@wordpress/element', () => ( {
	...require( 'react' ),
	createPortal: require( 'react-dom' ).createPortal,
} ) );

// The media modal is the browser's business. The mock's button hands the picked items
// to onSelect, as the modal does: an array when `multiple`, one item otherwise.
const mockSelection = { items: [] };
jest.mock( '@wordpress/block-editor', () => ( {
	MediaUploadCheck: ( { children } ) => children,
	MediaUpload: ( { render: renderButton, onSelect, multiple } ) =>
		renderButton( {
			open: () => onSelect( multiple ? mockSelection.items : mockSelection.items[ 0 ] ),
		} ),
} ) );

/**
 * A media library item as the modal hands it over.
 *
 * @param {number} id        - Attachment id.
 * @param {object} overrides - Fields to change.
 * @return {object} The item.
 */
const media = ( id, overrides = {} ) => ( {
	id,
	filename: `photo-${ id }.jpg`,
	mime: 'image/jpeg',
	filesizeInBytes: 1024,
	width: 800,
	height: 600,
	url: `https://example.test/photo-${ id }.jpg`,
	sizes: { thumbnail: { url: `https://example.test/photo-${ id }-150.jpg` } },
	...overrides,
} );

/**
 * An image as the block stores it.
 *
 * @param {string} assetId   - PayPal's id.
 * @param {object} overrides - Fields to change.
 * @return {object} The image.
 */
const stored = ( assetId, overrides = {} ) => ( {
	assetId,
	status: 'APPROVED',
	attachmentId: 1,
	name: `${ assetId }.jpg`,
	thumbnailUrl: `https://example.test/${ assetId }.jpg`,
	...overrides,
} );

/**
 * Answer the upload with one row per attachment id.
 *
 * @param {Function} row - Maps an attachment id to PayPal's row for it.
 * @return {jest.Mock} The apiFetch mock.
 */
const uploadAnswers = row =>
	apiFetch.mockImplementation( ( { data } ) =>
		Promise.resolve( { images: data.attachment_ids.map( row ) } )
	);

const rows = () => screen.getAllByRole( 'listitem' );

// The notice also announces its text through the a11y speak region.
const noticeText = text =>
	screen.getByText( text, { ignore: 'script, style, .a11y-speak-region, .a11y-speak-region *' } );

describe( 'ProductImages', () => {
	beforeEach( () => {
		apiFetch.mockReset();
		forgetUploadedImages();
		mockSelection.items = [];
	} );

	it( 'uploads the picked images and lists what PayPal took, the first as primary', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();
		mockSelection.items = [ media( 1 ), media( 2 ) ];
		uploadAnswers( id => ( { attachment_id: id, asset_id: `asset-${ id }`, status: 'APPROVED' } ) );
		render( <ProductImages images={ [] } onChange={ onChange } /> );

		await user.click( screen.getByRole( 'button', { name: 'Add images' } ) );

		await waitFor( () => expect( onChange ).toHaveBeenCalledTimes( 1 ) );
		expect( apiFetch ).toHaveBeenCalledWith(
			expect.objectContaining( { method: 'POST', data: { attachment_ids: [ 1, 2 ] } } )
		);
		expect( onChange ).toHaveBeenCalledWith( [
			expect.objectContaining( {
				assetId: 'asset-1',
				attachmentId: 1,
				name: 'photo-1.jpg',
				thumbnailUrl: 'https://example.test/photo-1-150.jpg',
				status: 'APPROVED',
			} ),
			expect.objectContaining( { assetId: 'asset-2' } ),
		] );
	} );

	it( 'shows the uploading rows until PayPal answers', async () => {
		const user = userEvent.setup();
		let answer;
		apiFetch.mockReturnValue( new Promise( resolve => ( answer = resolve ) ) );
		mockSelection.items = [ media( 1 ) ];
		render( <ProductImages images={ [] } onChange={ () => {} } /> );

		await user.click( screen.getByRole( 'button', { name: 'Add images' } ) );

		expect( screen.getByText( 'Uploading photo-1.jpg…' ) ).toBeInTheDocument();
		answer( { images: [] } );
		await waitFor( () =>
			expect( screen.queryByText( 'Uploading photo-1.jpg…' ) ).not.toBeInTheDocument()
		);
	} );

	// PayPal answers per file, so one refusal must not lose the others.
	it( 'keeps the images PayPal took and says why it refused the rest', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();
		mockSelection.items = [ media( 1 ), media( 2 ) ];
		uploadAnswers( id =>
			id === 1
				? { attachment_id: 1, asset_id: 'asset-1', status: 'APPROVED' }
				: {
						attachment_id: 2,
						error: { name: 'IMAGE_REJECTED', message: 'photo-2.jpg did not pass the check.' },
					}
		);
		render( <ProductImages images={ [] } onChange={ onChange } /> );

		await user.click( screen.getByRole( 'button', { name: 'Add images' } ) );

		await waitFor( () => expect( onChange ).toHaveBeenCalledTimes( 1 ) );
		expect( onChange.mock.calls[ 0 ][ 0 ] ).toHaveLength( 1 );
		expect( noticeText( 'photo-2.jpg did not pass the check.' ) ).toBeInTheDocument();
	} );

	it.each( [
		[ 'a GIF', { mime: 'image/gif' }, 'photo-1.jpg is not a JPEG, PNG, BMP or TIFF image.' ],
		[ 'a file over 12 MB', { filesizeInBytes: 13 * 1024 * 1024 }, 'photo-1.jpg is over 12 MB.' ],
		[
			'an image too wide',
			{ width: 9001 },
			'photo-1.jpg must be between 10 and 9000 pixels on each side.',
		],
	] )( 'refuses %s before sending it', async ( _label, overrides, message ) => {
		const user = userEvent.setup();
		mockSelection.items = [ media( 1, overrides ) ];
		render( <ProductImages images={ [] } onChange={ () => {} } /> );

		await user.click( screen.getByRole( 'button', { name: 'Add images' } ) );

		expect( noticeText( message ) ).toBeInTheDocument();
		expect( apiFetch ).not.toHaveBeenCalled();
	} );

	it( 'sends no more than the slots left', async () => {
		const user = userEvent.setup();
		mockSelection.items = [ media( 5 ), media( 6 ), media( 7 ) ];
		uploadAnswers( id => ( { attachment_id: id, asset_id: `asset-${ id }` } ) );
		render(
			<ProductImages
				images={ [ stored( 'a' ), stored( 'b' ), stored( 'c' ) ] }
				onChange={ () => {} }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Add images' } ) );

		await waitFor( () => expect( apiFetch ).toHaveBeenCalledTimes( 1 ) );
		expect( apiFetch.mock.calls[ 0 ][ 0 ].data ).toEqual( { attachment_ids: [ 5, 6 ] } );
	} );

	it( 'offers no add button at five images', () => {
		render(
			<ProductImages
				images={ [ 'a', 'b', 'c', 'd', 'e' ].map( id => stored( id ) ) }
				onChange={ () => {} }
			/>
		);

		expect( screen.queryByRole( 'button', { name: 'Add images' } ) ).not.toBeInTheDocument();
		expect( rows() ).toHaveLength( 5 );
	} );

	it( 'badges the first image as primary and moves another to the front from its menu', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();
		const images = [ stored( 'a' ), stored( 'b' ), stored( 'c' ) ];
		render( <ProductImages images={ images } onChange={ onChange } /> );

		expect( within( rows()[ 0 ] ).getByText( 'Primary' ) ).toBeInTheDocument();
		expect( within( rows()[ 1 ] ).queryByText( 'Primary' ) ).not.toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'Options for c.jpg' } ) );
		await user.click( await screen.findByRole( 'menuitem', { name: 'Make primary' } ) );

		expect( onChange ).toHaveBeenCalledWith( [ images[ 2 ], images[ 0 ], images[ 1 ] ] );
	} );

	it( 'removes the primary image from its own button, and the next one leads', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();
		const images = [ stored( 'a' ), stored( 'b' ) ];
		render( <ProductImages images={ images } onChange={ onChange } /> );

		await user.click( screen.getByRole( 'button', { name: 'Remove a.jpg' } ) );

		expect( onChange ).toHaveBeenCalledWith( [ images[ 1 ] ] );
	} );

	// An image a save never took is PayPal's orphan unless the editor deletes it.
	it( 'deletes an image it uploaded when that image is removed before a save', async () => {
		const user = userEvent.setup();
		let images = [];
		const onChange = jest.fn( next => ( images = next ) );
		mockSelection.items = [ media( 1 ) ];
		uploadAnswers( id => ( { attachment_id: id, asset_id: `asset-${ id }` } ) );
		const { rerender } = render( <ProductImages images={ images } onChange={ onChange } /> );

		await user.click( screen.getByRole( 'button', { name: 'Add images' } ) );
		await waitFor( () => expect( onChange ).toHaveBeenCalledTimes( 1 ) );
		rerender( <ProductImages images={ images } onChange={ onChange } /> );
		apiFetch.mockResolvedValue( {} );

		await user.click( screen.getByRole( 'button', { name: 'Remove photo-1.jpg' } ) );

		expect( apiFetch ).toHaveBeenLastCalledWith(
			expect.objectContaining( { method: 'DELETE', data: { asset_id: 'asset-1' } } )
		);
	} );

	it( 'leaves an image read from the payment alone at PayPal when it is removed', async () => {
		const user = userEvent.setup();
		render( <ProductImages images={ [ stored( 'a' ) ] } onChange={ () => {} } /> );

		await user.click( screen.getByRole( 'button', { name: 'Remove a.jpg' } ) );

		expect( apiFetch ).not.toHaveBeenCalled();
	} );

	// PayPal answers 422 to a PUT that drops an image it is still reviewing.
	it( 'does not let an in-review image off a saved payment', () => {
		render(
			<ProductImages
				images={ [ stored( 'a', { status: 'IN_REVIEW' } ) ] }
				onChange={ () => {} }
				hasPayment
			/>
		);

		expect( screen.getByText( 'In review' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Remove a.jpg' } ) ).toBeDisabled();
	} );
} );

describe( 'OptionImage', () => {
	beforeEach( () => {
		apiFetch.mockReset();
		forgetUploadedImages();
		mockSelection.items = [];
	} );

	it( 'uploads one image for the option', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();
		mockSelection.items = [ media( 3 ) ];
		uploadAnswers( id => ( {
			attachment_id: id,
			asset_id: `asset-${ id }`,
			status: 'IN_REVIEW',
		} ) );
		render( <OptionImage image={ null } onChange={ onChange } optionLabel="Red" /> );

		await user.click( screen.getByRole( 'button', { name: 'Add image to Red' } ) );

		await waitFor( () =>
			expect( onChange ).toHaveBeenCalledWith(
				expect.objectContaining( { assetId: 'asset-3', status: 'IN_REVIEW' } )
			)
		);
	} );

	it( 'clears the option when its image is removed', async () => {
		const user = userEvent.setup();
		const onChange = jest.fn();
		render( <OptionImage image={ stored( 'a' ) } onChange={ onChange } optionLabel="Red" /> );

		await user.click( screen.getByRole( 'button', { name: 'Remove a.jpg from Red' } ) );

		expect( onChange ).toHaveBeenCalledWith( null );
	} );
} );
