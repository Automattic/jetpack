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
		<div className="editor-post-featured-image__container">
			<div className="editor-post-featured-image__preview">
				{ media &&
					! isLoading &&
					( media.type === 'video' ? (
						<video className="editor-post-featured-image__preview-image" controls>
							<source src={ media.url } />
						</video>
					) : (
						<img
							className="editor-post-featured-image__preview-image"
							src={ media.url }
							alt={ __( 'Media preview', 'jetpack-publicize-components' ) }
						/>
					) ) }
				{ isLoading && <Spinner /> }
			</div>
			{ media && ! isLoading && (
				<HStack className="editor-post-featured-image__actions">
					<Button
						__next40pxDefaultSize
						className="editor-post-featured-image__action"
						onClick={ onReplace }
						disabled={ disabled }
					>
						{ __( 'Replace', 'jetpack-publicize-components' ) }
					</Button>
					<Button
						__next40pxDefaultSize
						className="editor-post-featured-image__action"
						onClick={ onRemove }
						disabled={ disabled }
						isDestructive
					>
						{ __( 'Remove', 'jetpack-publicize-components' ) }
					</Button>
				</HStack>
			) }
		</div>
	);
}
