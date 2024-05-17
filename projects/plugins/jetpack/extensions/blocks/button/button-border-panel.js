import { PanelBody, RangeControl } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	INITIAL_BORDER_RADIUS_POSITION,
	MAX_BORDER_RADIUS_VALUE,
	MIN_BORDER_RADIUS_VALUE,
} from './constants';

export default function ButtonBorderPanel( { borderRadius = '', setAttributes } ) {
	const setBorderRadius = useCallback(
		newBorderRadius => setAttributes( { borderRadius: newBorderRadius } ),
		[ setAttributes ]
	);

	return (
		<PanelBody title={ __( 'Border Settings', 'jetpack' ) }>
			<RangeControl
				allowReset
				initialPosition={ INITIAL_BORDER_RADIUS_POSITION }
				label={ __( 'Border radius', 'jetpack' ) }
				max={ MAX_BORDER_RADIUS_VALUE }
				min={ MIN_BORDER_RADIUS_VALUE }
				onChange={ setBorderRadius }
				value={ borderRadius }
			/>
		</PanelBody>
	);
}
