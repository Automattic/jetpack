import { getRedirectUrl, ThemeProvider } from '@automattic/jetpack-components';
import apiFetch from '@wordpress/api-fetch';
import { Spinner } from '@wordpress/components';
import { select, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import useImageGeneratorConfig from '../../hooks/use-image-generator-config';
import styles from './styles.module.scss';

const getMediaSourceUrl = media => {
	return media?.media_details?.sizes?.large?.source_url || media?.source_url;
};

/**
 * Fetches the preview of the generated image based on the post info
 *
 * @returns {React.ReactNode} The generated image preview.
 */
export default function GeneratedImagePreview() {
	const [ generatedImageUrl, setGeneratedImageUrl ] = useState( null );
	const [ isLoading, setIsLoading ] = useState( true );

	const { customText, imageType, imageId, template } = useImageGeneratorConfig();
	const { getMedia } = select( 'core' );
	const { title, featuredImage } = useSelect( _select => ( {
		title: _select( editorStore ).getEditedPostAttribute( 'title' ),
		featuredImage: _select( editorStore ).getEditedPostAttribute( 'featured_media' ),
	} ) );

	const currentTitle = useRef( title );
	const currentCustomText = useRef( customText );

	const getImageUrl = useCallback(
		type => {
			if ( type === 'featured' ) {
				return getMediaSourceUrl( getMedia( featuredImage ) );
			}
			if ( type === 'custom' ) {
				return getMediaSourceUrl( getMedia( imageId ) );
			}

			return null;
		},
		[ featuredImage, getMedia, imageId ]
	);

	useEffect( () => {
		const handler = setTimeout(
			async () => {
				setIsLoading( true );

				const sig_token = await apiFetch( {
					path: '/jetpack/v4/social-image-generator/generate-preview-token',
					method: 'POST',
					data: {
						text: customText || title || 'Your Title',
						image_url: getImageUrl( imageType ),
						template,
					},
				} );

				const url = getRedirectUrl( 'sigenerate', { query: `t=${ sig_token }` } );
				if ( generatedImageUrl === url ) {
					setIsLoading( false );
					return;
				}
				setGeneratedImageUrl( url );
			},
			// We only want to debounce on string changes.
			currentTitle.current === title && currentCustomText.current === customText ? 0 : 1500
		);

		return () => {
			clearTimeout( handler );
			currentTitle.current = title;
			currentCustomText.current = customText;
		};
	}, [
		title,
		featuredImage,
		customText,
		imageType,
		imageId,
		getMedia,
		template,
		getImageUrl,
		generatedImageUrl,
	] );

	const onImageLoad = useCallback( () => {
		setIsLoading( false );
	}, [] );

	return (
		<ThemeProvider>
			<div className={ styles.container }>
				<img
					className={ classNames( {
						[ styles.hidden ]: isLoading,
					} ) }
					src={ generatedImageUrl }
					alt="Generated preview"
					onLoad={ onImageLoad }
				></img>
				{ isLoading && <Spinner data-testid="spinner" /> }
			</div>
		</ThemeProvider>
	);
}
