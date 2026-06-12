/**
 * MediaFocalPoint component
 * Lets the user mark the most important part of the social image
 */

import { FocalPointPicker } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { usePostMeta } from '../../hooks/use-post-meta';
import { MediaFocalPointProps } from './types';

const DEFAULT_FOCAL_POINT = { x: 0.5, y: 0.5 };

/**
 * MediaFocalPoint component
 *
 * @param {MediaFocalPointProps} props - Component props
 * @return MediaFocalPoint component
 */
export default function MediaFocalPoint( { url, attachmentId }: MediaFocalPointProps ) {
	const { imageFocalPoints, updateImageFocalPoint } = usePostMeta();

	// One point per image: look up the entry for this attachment.
	const value = imageFocalPoints?.[ attachmentId ] ?? DEFAULT_FOCAL_POINT;

	// Commit only on drag end (onChange); the picker tracks the marker during drag itself.
	const onChange = useCallback(
		( focalPoint: { x: number; y: number } ) => {
			updateImageFocalPoint( attachmentId, {
				x: Math.round( focalPoint.x * 100 ) / 100,
				y: Math.round( focalPoint.y * 100 ) / 100,
			} );
		},
		[ attachmentId, updateImageFocalPoint ]
	);

	return (
		<FocalPointPicker
			__nextHasNoMarginBottom
			label={ __( 'Focal point', 'jetpack-publicize-pkg' ) }
			help={ __(
				'Drag the point to the most important part of the image.',
				'jetpack-publicize-pkg'
			) }
			url={ url }
			value={ value }
			onChange={ onChange }
		/>
	);
}
