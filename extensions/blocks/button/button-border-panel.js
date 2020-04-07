/**
 * WordPress dependencies
 */
import { PanelBody, RangeControl } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	INITIAL_BORDER_RADIUS_POSITION,
	MAX_BORDER_RADIUS_VALUE,
	MIN_BORDER_RADIUS_VALUE,
} from './constants';

const ButtonBorderPanel = ( { buttonBorderRadius = '', setAttributes } ) => {
	const setButtonBorderRadius = useCallback(
		newButtonBorderRadius => setAttributes( { buttonBorderRadius: newButtonBorderRadius } ),
		[ setAttributes ]
	);

	return (
		<PanelBody title={ __( 'Button border settings', 'jetpack' ) }>
			<RangeControl
				allowReset
				initialPosition={ INITIAL_BORDER_RADIUS_POSITION }
				label={ __( 'Border radius', 'jetpack' ) }
				max={ MAX_BORDER_RADIUS_VALUE }
				min={ MIN_BORDER_RADIUS_VALUE }
				onChange={ setButtonBorderRadius }
				value={ buttonBorderRadius }
			/>
		</PanelBody>
	);
};

export default ButtonBorderPanel;
