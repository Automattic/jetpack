/**
 * MediaFocalPoint component
 * Lets the user mark the most important part of the social image
 */

import { FocalPointPicker } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { MediaFocalPointProps } from './types';
import type { FocalPoint } from '../../utils/types';

/**
 * MediaFocalPoint component
 *
 * @param {MediaFocalPointProps} props - Component props
 * @return MediaFocalPoint component
 */
export default function MediaFocalPoint( { url, value, onChange }: MediaFocalPointProps ) {
	// Commit only on drag end (onChange); the picker tracks the marker during drag itself.
	// Round to 2 decimals before handing the point up for persistence.
	const handleChange = useCallback(
		( point: FocalPoint ) => {
			onChange( {
				x: Math.round( point.x * 100 ) / 100,
				y: Math.round( point.y * 100 ) / 100,
			} );
		},
		[ onChange ]
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
			onChange={ handleChange }
		/>
	);
}
