/**
 *External dependencies
 */
import { PanelColorSettings } from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { useDebounce } from '@wordpress/compose';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { VideoBlockColorAttributesProps, VideoControlProps } from '../../types';
import type React from 'react';
import './style.scss';

/**
 * Sidebar Control component.
 *
 * @param {VideoControlProps} props - Component props.
 * @returns {React.ReactElement}    Component template
 */
export default function ColorPanel( { attributes, setAttributes }: VideoControlProps ) {
	const { useAverageColor, seekbarColor, seekbarLoadingColor, seekbarPlayedColor } = attributes;

	const initialColorState: VideoBlockColorAttributesProps = {
		seekbarPlayedColor,
		seekbarLoadingColor,
		seekbarColor,
	};

	const [ colors, setColorsState ] = useState( initialColorState );

	const debouncedSetColors = useDebounce( colorsToUpdate => {
		setAttributes( colorsToUpdate );
	}, 2000 );

	const setColor = useCallback( colorToUpdate => {
		setColorsState( state => ( { ...state, ...colorToUpdate } ) );
		debouncedSetColors( colorToUpdate );
	}, [] );

	return (
		<PanelBody title={ __( 'Color', 'jetpack-videopress-pkg' ) } initialOpen={ false }>
			<ToggleControl
				label={ __( 'Dynamic color', 'jetpack-videopress-pkg' ) }
				help={ __( 'Colors adapt to the video as it plays', 'jetpack-videopress-pkg' ) }
				onChange={ newUseAverageColor => setAttributes( { useAverageColor: newUseAverageColor } ) }
				checked={ useAverageColor }
			/>

			{ ! useAverageColor && (
				<PanelColorSettings
					className="videopress-color-panel"
					opened={ ! useAverageColor }
					showTitle={ false }
					colorSettings={ [
						{
							label: __( 'Main', 'jetpack-videopress-pkg' ),
							showTitle: true,
							value: colors.seekbarColor,
							onChange: newSeekbarColor => setColor( { seekbarColor: newSeekbarColor } ),
						},
						{
							label: __( 'Loaded', 'jetpack-videopress-pkg' ),
							showTitle: true,
							value: colors.seekbarLoadingColor,
							onChange: newSeekbarLoadingColor =>
								setColor( { seekbarLoadingColor: newSeekbarLoadingColor } ),
						},
						{
							label: __( 'Progress', 'jetpack-videopress-pkg' ),
							showTitle: true,
							value: colors.seekbarPlayedColor,
							onChange: newSeekbarPlayedColor =>
								setColor( { seekbarPlayedColor: newSeekbarPlayedColor } ),
						},
					] }
				/>
			) }
		</PanelBody>
	);
}
