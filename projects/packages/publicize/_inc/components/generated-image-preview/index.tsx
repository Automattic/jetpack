import { ThemeProvider } from '@automattic/jetpack-components';
import { Spinner, BaseControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { useCallback, useState } from 'react';
import useSigPreview from '../../hooks/use-sig-preview';
import { type ImageType } from '../../hooks/use-sig-preview/utils';
import styles from './styles.module.scss';

// Re-export for backwards compatibility
export {
	FEATURED_IMAGE_STILL_LOADING,
	calculateImageUrl,
	getImageId,
} from '../../hooks/use-sig-preview/utils';

type GeneratedImagePreviewProps = {
	shouldDebounce?: boolean;
	onNewToken?: ( token: string ) => void;
	customText?: string;
	imageType?: ImageType;
	imageId?: number | null;
	defaultImageId?: number | null;
	template?: string;
	font?: string;
};

/**
 * Fetches the preview of the generated image based on the post info
 *
 * @param {GeneratedImagePreviewProps} props - The props to pass to the generator config.
 *                                           Contains the imageType, imageId, template and customText.
 *                                           Also contains boolean shouldDebounce.
 * @return The generated image preview.
 */
export default function GeneratedImagePreview( {
	shouldDebounce = true,
	onNewToken,
	...configOverrides
}: GeneratedImagePreviewProps ) {
	const [ imageLoaded, setImageLoaded ] = useState( false );

	const { url, isLoading: isHookLoading } = useSigPreview( true, {
		shouldDebounce,
		onNewToken,
		...configOverrides,
	} );

	// Combined loading state: hook is loading OR image hasn't loaded yet
	const isLoading = isHookLoading || ( url && ! imageLoaded );

	const onImageLoad = useCallback( () => {
		setImageLoaded( true );
	}, [] );

	// Reset imageLoaded when URL changes
	const prevUrlRef = useCallback(
		( node: HTMLImageElement | null ) => {
			if ( node && node.src !== url ) {
				setImageLoaded( false );
			}
		},
		[ url ]
	);

	return (
		<ThemeProvider>
			<BaseControl __nextHasNoMarginBottom={ true } className={ styles.wrapper }>
				<div className={ styles.container }>
					<img
						ref={ prevUrlRef }
						className={ clsx( {
							[ styles.hidden ]: isLoading,
						} ) }
						src={ url ?? undefined }
						alt={ __( 'Generated preview', 'jetpack-publicize-pkg' ) }
						onLoad={ onImageLoad }
					/>
					{ isLoading && <Spinner data-testid="spinner" /> }
				</div>
			</BaseControl>
		</ThemeProvider>
	);
}
