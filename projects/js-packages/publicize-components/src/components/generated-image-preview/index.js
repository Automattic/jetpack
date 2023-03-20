import { ThemeProvider } from '@automattic/jetpack-components';
import { Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import React, { useEffect, useRef, useState } from 'react';
import useImageGeneratorConfig from '../../hooks/use-image-generator-config';
import styles from './styles.module.scss';

/**
 * Fetches the preview of the generated image based on the post info
 *
 * @returns {React.ReactNode} The generated image preview.
 */
export default function GeneratedImagePreview() {
	const [ generatedImageUrl, setGeneratedImageUrl ] = useState( null );
	const [ isLoading, setIsLoading ] = useState( true );

	const { customText, imageType, imageId } = useImageGeneratorConfig();
	const { title, featuredImage } = useSelect( select => ( {
		title: select( editorStore ).getEditedPostAttribute( 'title' ),
		featuredImage: select( editorStore ).getEditedPostAttribute( 'featured_media' ),
	} ) );

	const currentTitle = useRef( title );
	const currentCustomText = useRef( customText );

	useEffect( () => {
		const handler = setTimeout(
			async () => {
				setIsLoading( true );
				const rawResponse = await fetch( 'https://httpbin.org/post', {
					method: 'POST',
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json',
					},
					body: JSON.stringify( { title } ),
				} );
				const content = await rawResponse.json();

				setGeneratedImageUrl(
					`https://dummyimage.com/1200x630/d9d9d9/06a32e&text=${ content.json.title }`
				);
				setIsLoading( false );
			},
			// We only want to debounce on string changes.
			currentTitle.current === title && currentCustomText.current === customText ? 0 : 1500
		);

		return () => {
			clearTimeout( handler );
			currentTitle.current = title;
			currentCustomText.current = customText;
		};
	}, [ title, featuredImage, customText, imageType, imageId ] );

	return (
		<ThemeProvider>
			<div className={ styles.container }>
				{ ! isLoading ? (
					<img className={ styles.preview } src={ generatedImageUrl } alt="Generated preview"></img>
				) : (
					<Spinner />
				) }
			</div>
		</ThemeProvider>
	);
}
