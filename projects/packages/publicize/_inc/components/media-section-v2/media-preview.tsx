/**
 * MediaPreview component
 * Displays media preview
 */

import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import styles from './styles.module.scss';
import { MediaPreviewProps } from './types';

/**
 * MediaPreview component
 *
 * @param {MediaPreviewProps} props - Component props
 * @return {JSX.Element|null} MediaPreview component
 */
export default function MediaPreview( { media, isLoading = false }: MediaPreviewProps ) {
	if ( ! media && ! isLoading ) {
		return null;
	}

	return (
		<div className={ styles.preview }>
			{ media &&
				! isLoading &&
				( media.type === 'video' ? (
					<video className={ styles.previewImage } controls>
						<source src={ media.url } />
					</video>
				) : (
					<img
						className={ styles.previewImage }
						src={ media.url }
						alt={ __( 'Media preview', 'jetpack-publicize-pkg' ) }
					/>
				) ) }
			{ isLoading && <Spinner /> }
		</div>
	);
}
