import { getRedirectUrl, ThemeProvider } from '@automattic/jetpack-components';
import apiFetch from '@wordpress/api-fetch';
import { Spinner } from '@wordpress/components';
import { select, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

	const imageTitle = useMemo( () => customText || title || 'Your Title', [ customText, title ] );
	const imageTitleRef = useRef( imageTitle );
	const getImageUrl = useCallback( () => {
		if ( imageType === 'featured' ) {
			return getMediaSourceUrl( getMedia( featuredImage ) );
		}
		if ( imageType === 'custom' ) {
			return getMediaSourceUrl( getMedia( imageId ) );
		}

		return null;
	}, [ featuredImage, getMedia, imageId, imageType ] );

	const generatedImageUrlRef = useRef( generatedImageUrl );

	useEffect( () => {
		generatedImageUrlRef.current = generatedImageUrl;
	} );

	useEffect( () => {
		const handler = setTimeout(
			async () => {
				setIsLoading( true );

				const sig_token = await apiFetch( {
					path: '/jetpack/v4/social-image-generator/generate-preview-token',
					method: 'POST',
					data: {
						text: imageTitle,
						image_url: getImageUrl(),
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
	}, [ imageTitle, template, getImageUrl ] );

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
