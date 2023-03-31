/**
 *External dependencies
 */
import { PanelColorSettings } from '@wordpress/block-editor';
import {
	PanelRow,
	ToggleControl,
	// eslint-disable-next-line wpcalypso/no-unsafe-wp-apis
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useDebounce } from '@wordpress/compose';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import editorImageURL from '../../../../utils/editor-image-url';
import { VideoBlockColorAttributesProps, VideoControlProps } from '../../types';
import dynamicColorsImage from './dynamic-colors.png';
import './style.scss';
/**
 * Types
 */
import type React from 'react';

/**
 * Sidebar Control component.
 *
 * @param {VideoControlProps} props - Component props.
 * @returns {React.ReactElement}    Component template
 */
export default function ColorPanel( { clientId, attributes, setAttributes }: VideoControlProps ) {
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

	const resetStaticColors = useCallback( () => {
		setColorsState( {} );

		setAttributes( {
			useAverageColor: true,
			seekbarColor: '',
			seekbarLoadingColor: '',
			seekbarPlayedColor: '',
		} );
	}, [] );

	return (
		<ToolsPanelItem
			className="videopress-playback-bar-colors-panel-item"
			hasValue={ () => ! useAverageColor }
			label={ __( 'Dynamic color', 'jetpack-videopress-pkg' ) }
			resetAllFilter={ resetStaticColors }
			isShownByDefault
			panelId={ clientId }
			onDeselect={ resetStaticColors }
		>
			<PanelRow className="videopress-color-panel__title">
				{ __( 'Playback bar colors', 'jetpack-videopress-pkg' ) }
			</PanelRow>

			<ToggleControl
				label={ __( 'Dynamic color', 'jetpack-videopress-pkg' ) }
				help={
					<>
						{ __(
							'Playback bar colors adapt to the video as it plays.',
							'jetpack-videopress-pkg'
						) }
						<img
							className="videopress-dynamic-color-example"
							src={ editorImageURL( dynamicColorsImage ) }
							alt={ __( 'Dynamic colors example', 'jetpack-videopress-pkg' ) }
						></img>
					</>
				}
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
		</ToolsPanelItem>
	);
}
