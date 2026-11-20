import { act, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { dispatch, select, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

export const clientId = 'uploading-block';

// jsdom implements neither.
window.URL.createObjectURL = file => `blob:placeholder-${ file.name }`;
window.URL.revokeObjectURL = () => {};

export const getBlockAttributes = () => select( blockEditorStore ).getBlockAttributes( clientId );

export const isSavingLocked = () => select( editorStore ).isPostSavingLocked();

/**
 * Renders `Edit` with the block's attributes from the store, as the editor does, and nothing once it's removed.
 *
 * @param {object}   props      - Props for `Edit`.
 * @param {Function} props.Edit - The block's edit component.
 * @return {Element|null} The block's edit component.
 */
function StoreBlockEdit( { Edit, ...props } ) {
	const attributes = useSelect(
		storeSelect => storeSelect( blockEditorStore ).getBlockAttributes( clientId ),
		[]
	);
	return attributes ? <Edit { ...props } attributes={ attributes } /> : null;
}

export const makeFiles = ( names, FileClass = File ) =>
	names.map( name => new FileClass( [ name ], `${ name }.jpg`, { type: 'image/jpeg' } ) );

/**
 * Renders a block backed by the block editor store, uploads `files` through its file input, and returns each upload call.
 *
 * @param {object}   options            - Options.
 * @param {Function} options.Edit       - The block's edit component.
 * @param {string}   options.name       - The block's name.
 * @param {object}   options.attributes - The block's attributes before the upload.
 * @param {File[]}   options.files      - The files to upload.
 * @param {object}   [options.props]    - Extra props for `Edit`.
 * @return {Promise<Array>} The options passed to each `mediaUpload` call.
 */
export async function uploadFiles( { Edit, name, attributes, files, props } ) {
	const uploads = [];
	const { resetBlocks, updateBlockAttributes, updateSettings } = dispatch( blockEditorStore );
	updateSettings( { mediaUpload: options => uploads.push( options ) } );
	resetBlocks( [ { clientId, name, attributes, innerBlocks: [] } ] );

	const { container } = render(
		<StoreBlockEdit
			Edit={ Edit }
			clientId={ clientId }
			isSelected
			noticeOperations={ { createErrorNotice: jest.fn() } }
			setAttributes={ attrs => updateBlockAttributes( clientId, attrs ) }
			{ ...props }
		/>
	);
	// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
	await userEvent.setup().upload( container.querySelector( 'input[type="file"]' ), files );
	return uploads;
}

/**
 * Reports every uploaded file on its own, with a new attachment each, as client-side media processing does.
 *
 * @param {Array} uploads - The options passed to each `mediaUpload` call.
 */
export function reportEachFile( uploads ) {
	let id = 10;
	act( () => {
		uploads.forEach( ( { filesList, onFileChange } ) =>
			Array.from( filesList ).forEach( file =>
				onFileChange( [ { id: id++, url: `http://example.com/${ file.name }` } ] )
			)
		);
	} );
}
