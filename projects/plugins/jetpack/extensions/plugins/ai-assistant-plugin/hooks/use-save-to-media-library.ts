/**
 * External dependencies
 */
import { isBlobURL } from '@wordpress/blob';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useState } from 'react';
/**
 * Types
 */
import type { BlockEditorStore } from '../../../blocks/ai-assistant/types';

export default function useSaveToMediaLibrary() {
	const [ isLoading, setIsLoading ] = useState( false );
	const { getSettings } = useSelect( blockEditorStore, [] ) as BlockEditorStore[ 'selectors' ];

	const saveToMediaLibrary = ( url: string ): Promise< { id: string } > => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const settings = getSettings() as any;

		return new Promise( ( resolve, reject ) => {
			fetch( url ).then( response => {
				response.blob().then( ( blob: Blob ) => {
					const filesList = [ blob ];
					settings.mediaUpload( {
						allowedTypes: [ 'image' ],
						filesList,
						onFileChange( [ image ] ) {
							if ( isBlobURL( image?.url ) ) {
								setIsLoading( true );
								return;
							}

							if ( image ) {
								resolve( image );
							}

							setIsLoading( false );
						},
						onError( message ) {
							// TODO: Handle error
							reject( message );
						},
					} );
				} );
			} );
		} );
	};

	return {
		isLoading,
		saveToMediaLibrary,
	};
}
