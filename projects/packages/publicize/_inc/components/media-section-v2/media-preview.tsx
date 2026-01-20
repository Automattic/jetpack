/**
 * MediaPreview component
 * Displays media preview
 */

import {
	Button,
	Spinner,
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import styles from './styles.module.scss';
import { MediaPreviewProps } from './types';

/**
 * MediaPreview component matching WordPress core featured image pattern
 *
 * @param {MediaPreviewProps} props - Component props
 * @return {JSX.Element|null} MediaPreview component
 */
export default function MediaPreview( {
	media,
	isLoading = false,
	onReplace,
	onRemove,
	disabled = false,
}: MediaPreviewProps ) {
	if ( ! media && ! isLoading ) {
		return null;
	}

	return (
		<div className={ styles.container }>
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
			{ ( media || isLoading ) && (
				<HStack className={ styles.actions }>
					<Button
						__next40pxDefaultSize
						className={ styles.action }
						onClick={ onReplace }
						disabled={ disabled }
					>
						{ __( 'Replace', 'jetpack-publicize-pkg' ) }
					</Button>
					<Button
						__next40pxDefaultSize
						className={ styles.action }
						onClick={ onRemove }
						disabled={ disabled }
					>
						{ __( 'Remove', 'jetpack-publicize-pkg' ) }
					</Button>
				</HStack>
			) }
		</div>
	);
}
