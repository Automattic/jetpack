/**
 * MediaFocalPoint component
 * Lets the user mark the most important part of the social image
 */

import { FocalPointPicker } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import styles from './styles.module.scss';
import { MediaFocalPointProps } from './types';
import type { FocalPoint } from '../../utils/types';

const roundPoint = ( point: FocalPoint ): FocalPoint => ( {
	x: Math.round( point.x * 100 ) / 100,
	y: Math.round( point.y * 100 ) / 100,
} );

/**
 * MediaFocalPoint component
 *
 * @param {MediaFocalPointProps} props - Component props
 * @return MediaFocalPoint component
 */
export default function MediaFocalPoint( { url, value, onChange, onDrag }: MediaFocalPointProps ) {
	const handleChange = useCallback(
		( point: FocalPoint ) => onChange( roundPoint( point ) ),
		[ onChange ]
	);
	const handleDrag = useCallback(
		( point: FocalPoint ) => onDrag?.( roundPoint( point ) ),
		[ onDrag ]
	);

	return (
		<div className={ styles[ 'focal-point' ] }>
			<FocalPointPicker
				__nextHasNoMarginBottom
				label={ __( 'Focal point', 'jetpack-publicize-pkg' ) }
				hideLabelFromVision
				help={ __(
					'Drag the handle to adjust the visible portion of the image.',
					'jetpack-publicize-pkg'
				) }
				url={ url }
				value={ value }
				onChange={ handleChange }
				onDragStart={ handleDrag }
				onDrag={ handleDrag }
			/>
		</div>
	);
}
