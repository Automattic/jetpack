import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThumbnailUpdateButton from '../thumbnail-update-button';

describe( 'ThumbnailUpdateButton', () => {
	it( 'opens a popover with both items on click', async () => {
		const user = userEvent.setup();
		render(
			<ThumbnailUpdateButton
				canSelectFromVideo
				canUploadImage
				isBusy={ false }
				onSelectFromVideo={ jest.fn() }
				onUploadImage={ jest.fn() }
			/>
		);
		await user.click( screen.getByRole( 'button', { name: /update thumbnail/i } ) );
		expect( screen.getByRole( 'menuitem', { name: /select from video/i } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'menuitem', { name: /upload image/i } ) ).toBeInTheDocument();
	} );

	it( 'fires onSelectFromVideo when the matching item is clicked', async () => {
		const user = userEvent.setup();
		const onSelectFromVideo = jest.fn();
		render(
			<ThumbnailUpdateButton
				canSelectFromVideo
				canUploadImage
				isBusy={ false }
				onSelectFromVideo={ onSelectFromVideo }
				onUploadImage={ jest.fn() }
			/>
		);
		await user.click( screen.getByRole( 'button', { name: /update thumbnail/i } ) );
		await user.click( screen.getByRole( 'menuitem', { name: /select from video/i } ) );
		expect( onSelectFromVideo ).toHaveBeenCalledTimes( 1 );
		expect(
			screen.queryByRole( 'menuitem', { name: /select from video/i } )
		).not.toBeInTheDocument();
	} );

	it( 'fires onUploadImage when the matching item is clicked', async () => {
		const user = userEvent.setup();
		const onUploadImage = jest.fn();
		render(
			<ThumbnailUpdateButton
				canSelectFromVideo
				canUploadImage
				isBusy={ false }
				onSelectFromVideo={ jest.fn() }
				onUploadImage={ onUploadImage }
			/>
		);
		await user.click( screen.getByRole( 'button', { name: /update thumbnail/i } ) );
		await user.click( screen.getByRole( 'menuitem', { name: /upload image/i } ) );
		expect( onUploadImage ).toHaveBeenCalledTimes( 1 );
		expect( screen.queryByRole( 'menuitem', { name: /upload image/i } ) ).not.toBeInTheDocument();
	} );

	it( 'disables Select from video when not allowed', async () => {
		const user = userEvent.setup();
		render(
			<ThumbnailUpdateButton
				canSelectFromVideo={ false }
				canUploadImage
				isBusy={ false }
				onSelectFromVideo={ jest.fn() }
				onUploadImage={ jest.fn() }
			/>
		);
		await user.click( screen.getByRole( 'button', { name: /update thumbnail/i } ) );
		// @wordpress/components MenuItem marks a disabled item with aria-disabled
		// (keeping it focusable) rather than the native disabled attribute.
		const item = screen.getByRole( 'menuitem', { name: /select from video/i } );
		expect( item ).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'disables Upload image when not allowed', async () => {
		const user = userEvent.setup();
		render(
			<ThumbnailUpdateButton
				canSelectFromVideo
				canUploadImage={ false }
				isBusy={ false }
				onSelectFromVideo={ jest.fn() }
				onUploadImage={ jest.fn() }
			/>
		);
		await user.click( screen.getByRole( 'button', { name: /update thumbnail/i } ) );
		expect( screen.getByRole( 'menuitem', { name: /upload image/i } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'disables the trigger when busy', () => {
		render(
			<ThumbnailUpdateButton
				canSelectFromVideo
				canUploadImage
				isBusy
				onSelectFromVideo={ jest.fn() }
				onUploadImage={ jest.fn() }
			/>
		);
		expect( screen.getByRole( 'button', { name: /update thumbnail/i } ) ).toBeDisabled();
	} );
} );
