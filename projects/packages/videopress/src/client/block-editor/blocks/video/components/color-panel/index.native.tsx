/**
 * External dependencies
 */
import { useNavigation } from '@react-navigation/native';
import { PanelColorSettings } from '@wordpress/block-editor';
import { PanelBody, ToggleControl, BottomSheet } from '@wordpress/components';
import { useDebounce } from '@wordpress/compose';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, chevronRight } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { VideoBlockColorAttributesProps, VideoControlProps } from '../../types';
/**
 * Types
 */
import type React from 'react';

/**
 * React component that renders the playback bar color settings panel.
 *
 * @param {VideoControlProps} props - Component properties.
 * @returns {React.ReactElement}    - Playback bar color settings panel.
 */
export default function ColorPanel( { attributes, setAttributes }: VideoControlProps ) {
	const [ showSubSheet, setShowSubSheet ] = useState( false );
	const navigation = useNavigation();

	const goBack = useCallback( () => {
		setShowSubSheet( false );
		navigation.goBack();
	}, [] );

	const openSubSheet = useCallback( () => {
		navigation.navigate( BottomSheet.SubSheet.screenName );
		setShowSubSheet( true );
	}, [] );

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
		<BottomSheet.SubSheet
			navigationButton={
				<BottomSheet.Cell
					label={ __( 'Playback Bar Color', 'jetpack-videopress-pkg' ) }
					onPress={ openSubSheet }
					leftAlign
					value={
						useAverageColor
							? __( 'Dynamic', 'jetpack-videopress-pkg' )
							: __( 'Manual', 'jetpack-videopress-pkg' )
					}
				>
					<Icon icon={ chevronRight }></Icon>
				</BottomSheet.Cell>
			}
			showSheet={ showSubSheet }
		>
			<>
				<BottomSheet.NavBar>
					<BottomSheet.NavBar.BackButton onPress={ goBack } />
					<BottomSheet.NavBar.Heading>
						{ __( 'Playback Bar Color', 'jetpack-videopress-pkg' ) }
					</BottomSheet.NavBar.Heading>
				</BottomSheet.NavBar>
				<PanelBody>
					<ToggleControl
						label={ __( 'Dynamic color', 'jetpack-videopress-pkg' ) }
						help={ __(
							'Playback bar colors adapt to the video as it plays.',
							'jetpack-videopress-pkg'
						) }
						onChange={ newUseAverageColor =>
							setAttributes( { useAverageColor: newUseAverageColor } )
						}
						checked={ useAverageColor }
					/>
				</PanelBody>

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
			</>
		</BottomSheet.SubSheet>
	);
}
