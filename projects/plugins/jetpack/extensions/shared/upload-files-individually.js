import { createBlobURL, isBlobURL, revokeBlobURL } from '@wordpress/blob';
import { useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

/**
 * Whether a media selection holds files to upload rather than library attachments.
 * Not `instanceof File`: files picked in the editor iframe come from that window's File.
 *
 * @param {Array} selection - What a media placeholder passed to `onSelect`.
 * @return {boolean} Whether the selection holds files.
 */
export const isFileSelection = selection =>
	Object.prototype.toString.call( selection?.[ 0 ] ) === '[object File]';

/**
 * Uploads each file on its own into a placeholder item added up front, which keeps the selection order:
 * client-side media processing reports one file per callback. Each result replaces its item, found by
 * URL, and a failure removes it.
 *
 * @param {object}          options                 - Options.
 * @param {FileList|File[]} options.files           - The files to upload.
 * @param {Function}        options.mediaUpload     - The block editor's `mediaUpload` setting.
 * @param {string[]}        options.allowedTypes    - The media types the block accepts.
 * @param {Function}        options.getItems        - Returns the block's current items, each with a `url`.
 * @param {Function}        options.setItems        - Saves the block's items.
 * @param {Function}        options.toItem          - Turns an attachment, and the item it replaces, into an item.
 * @param {Function}        [options.toPlaceholder] - Turns a file and its blob URL into its placeholder item.
 * @param {Function}        options.onError         - Reports an upload's error message.
 */
export default function uploadFilesIndividually( {
	files,
	mediaUpload,
	allowedTypes,
	getItems,
	setItems,
	toItem,
	toPlaceholder = ( file, url ) => ( { url } ),
	onError,
} ) {
	if ( ! mediaUpload ) {
		return;
	}
	const uploads = Array.from( files ).map( file => ( {
		file,
		placeholderUrl: createBlobURL( file ),
	} ) );
	setItems( [
		...getItems(),
		...uploads.map( ( { file, placeholderUrl } ) => toPlaceholder( file, placeholderUrl ) ),
	] );

	uploads.forEach( ( { file, placeholderUrl } ) => {
		let currentUrl = placeholderUrl;
		// Without media, the upload failed: drop its item.
		const updateUpload = media => {
			revokeBlobURL( placeholderUrl );
			const items = getItems();
			const index = items.findIndex( ( { url } ) => url === currentUrl );
			// The user removed this item while it was still uploading.
			if ( index === -1 ) {
				return;
			}
			if ( ! media ) {
				setItems( items.filter( ( item, i ) => i !== index ) );
				return;
			}
			const item = toItem( media, items[ index ] );
			currentUrl = item.url;
			setItems( items.map( ( existing, i ) => ( i === index ? item : existing ) ) );
		};
		mediaUpload( {
			allowedTypes,
			filesList: [ file ],
			onFileChange: ( [ media ] ) => updateUpload( media ),
			onError: message => {
				updateUpload();
				onError( message );
			},
		} );
	} );
}

/**
 * Locks post saving while `items` hold an upload's placeholder, so its blob URL is never saved.
 * Following the rendered items releases the lock however a placeholder goes, the block's removal included.
 *
 * @param {Array}  items    - The block's items, each with a `url`.
 * @param {string} lockName - A lock name unique to the block.
 */
export function usePlaceholderSaveLock( items, lockName ) {
	const { lockPostSaving, unlockPostSaving } = useDispatch( 'core/editor' );
	const hasPlaceholder = items.some( ( { url } ) => isBlobURL( url ) );

	useEffect( () => {
		if ( ! hasPlaceholder ) {
			return;
		}
		lockPostSaving( lockName );
		return () => unlockPostSaving( lockName );
	}, [ hasPlaceholder, lockName, lockPostSaving, unlockPostSaving ] );
}
