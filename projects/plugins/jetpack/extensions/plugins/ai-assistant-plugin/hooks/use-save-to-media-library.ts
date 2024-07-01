/**
 * External dependencies
 */
import { isBlobURL } from '@wordpress/blob';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import debugFactory from 'debug';
/**
 * Types
 */
import type { BlockEditorStore } from '../../../blocks/ai-assistant/types';

const debug = debugFactory( 'jetpack-ai-assistant-plugin:save-to-media-library' );

export default function useSaveToMediaLibrary() {
	const [ isLoading, setIsLoading ] = useState( false );
	const { getSettings } = useSelect(
		select => select( 'core/block-editor' ),
		[]
	) as BlockEditorStore[ 'selectors' ];

	const saveToMediaLibrary = ( url: string ): Promise< { id: string; url: string } > => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const settings = getSettings() as any;

		return new Promise( ( resolve, reject ) => {
			setIsLoading( true );

			debug( 'Fetching image from URL' );

			fetch( url )
				.then( response => {
					debug( 'Transforming response to blob' );

					response
						.blob()
						.then( ( blob: Blob ) => {
							debug( 'Uploading blob to media library' );

							const filesList = [ blob ];
							settings.mediaUpload( {
								allowedTypes: [ 'image' ],
								filesList,
								onFileChange( [ image ] ) {
									if ( isBlobURL( image?.url ) ) {
										return;
									}

									if ( image ) {
										debug( 'Image uploaded to media library', image );
										resolve( image );
									}

									setIsLoading( false );
								},
								onError( message ) {
									debug( 'Error uploading image to media library:', message );
									reject( message );
									setIsLoading( false );
								},
							} );
						} )
						.catch( e => {
							debug( 'Error transforming response to blob:', e?.message );
							reject( e?.message );
							setIsLoading( false );
						} );
				} )
				.catch( e => {
					debug( 'Error fetching image from URL:', e?.message );
					reject( e?.message );
					setIsLoading( false );
				} );
		} );
	};

	return {
		isLoading,
		saveToMediaLibrary,
	};
}
