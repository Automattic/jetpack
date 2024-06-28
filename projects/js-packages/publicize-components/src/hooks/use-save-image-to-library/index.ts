import { __ } from '@wordpress/i18n';
import { MediaItem, uploadMedia } from '@wordpress/media-utils';
import { useCallback, useMemo, useState } from 'react';

export type SaveImageToLibraryOptions = {
	onError?: ( error: Error ) => void;
	onSuccess?: ( image: MediaItem ) => void;
};

export type SaveImageToLibrary = {
	save: ( imageUrl: string, fileName?: string ) => Promise< void >;
	isSaving: boolean;
};

/**
 * Saves an image from a URL to the media library.
 *
 * @param {SaveImageToLibraryOptions} options - Options for the hook.
 *
 * @returns {SaveImageToLibrary} The object.
 */
export function useSaveImageToLibrary( { onError, onSuccess }: SaveImageToLibraryOptions ) {
	const [ isSaving, setIsSaving ] = useState( false );

	const save = useCallback< SaveImageToLibrary[ 'save' ] >(
		async ( imageUrl, fileName = 'image' ) => {
			try {
				setIsSaving( true );

				const response = await fetch( imageUrl );

				if ( ! response.ok ) {
					onError( new Error( __( 'Failed to download image.', 'jetpack' ), { cause: response } ) );

					return;
				}

				const blob = await response.blob();

				const file = new File( [ blob ], fileName, {
					type: blob.type,
				} );

				await uploadMedia( {
					filesList: [ file ],
					onFileChange: ( [ fileObj ] ) => {
						if ( fileObj.id !== undefined ) {
							onSuccess( fileObj );
							setIsSaving( false );
						}
					},
					onError: error => {
						onError(
							new Error( __( 'Failed to save image to library.', 'jetpack' ), { cause: error } )
						);

						setIsSaving( false );
					},
					maxUploadFileSize: 0,
				} );
			} catch ( error ) {
				onError(
					new Error( __( 'Failed to save image to library.', 'jetpack' ), { cause: error } )
				);
			} finally {
				setIsSaving( false );
			}
		},
		[ onError, onSuccess ]
	);

	return useMemo( () => {
		return {
			isSaving,
			save,
		};
	}, [ isSaving, save ] );
}
