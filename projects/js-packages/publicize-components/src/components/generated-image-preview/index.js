import { getRedirectUrl, ThemeProvider } from '@automattic/jetpack-components';
import apiFetch from '@wordpress/api-fetch';
import { Spinner, BaseControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useImageGeneratorConfig from '../../hooks/use-image-generator-config';
import styles from './styles.module.scss';

const FEATURED_IMAGE_STILL_LOADING = 'featured-image-still-loading';
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
	const { title, featuredImage } = useSelect( select => ( {
		title: select( editorStore ).getEditedPostAttribute( 'title' ),
		featuredImage: select( editorStore ).getEditedPostAttribute( 'featured_media' ),
	} ) );

	const imageUrl = useSelect( select => {
		const getMedia = select( 'core' ).getMedia;
		if ( imageType === 'none' ) {
			return null;
		}
		if ( imageType === 'custom' ) {
			return getMediaSourceUrl( getMedia( imageId ) );
		}
		// We default to the Featured image
		const media = getMedia( featuredImage );
		if ( ! media ) {
			return FEATURED_IMAGE_STILL_LOADING;
		}
		return getMediaSourceUrl( media );
	} );

	const imageTitle = useMemo( () => customText || title || ' ', [ customText, title ] );
	const imageTitleRef = useRef( imageTitle );

	const generatedImageUrlRef = useRef( generatedImageUrl );

	useEffect( () => {
		generatedImageUrlRef.current = generatedImageUrl;
	} );

	useEffect( () => {
		const handler = setTimeout(
			async () => {
				setIsLoading( true );

				if ( imageUrl === FEATURED_IMAGE_STILL_LOADING ) {
					return;
				}

				const sig_token = await apiFetch( {
					path: '/jetpack/v4/social-image-generator/generate-preview-token',
					method: 'POST',
					data: {
						text: imageTitle,
						image_url: imageUrl,
						template,
					},
				} );
				const url = getRedirectUrl( 'sigenerate', { query: `t=${ sig_token }` } );
				// If the URL turns out to be the same, we set the loading state to false,
				// as the <img> onLoad event will not fire if the src is the same.
				if ( url === generatedImageUrlRef.current ) {
					setIsLoading( false );
					return;
				}
				setGeneratedImageUrl( url );
			},
			// We only want to debounce on string changes.
			imageTitle === imageTitleRef.current ? 0 : 1500
		);

		return () => {
			clearTimeout( handler );
			imageTitleRef.current = imageTitle;
		};
	}, [ imageTitle, template, imageUrl ] );

	const onImageLoad = useCallback( () => {
		setIsLoading( false );
	}, [] );

	return (
		<ThemeProvider>
			<BaseControl label={ __( 'Preview', 'jetpack' ) }>
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
			</BaseControl>
		</ThemeProvider>
	);
}
