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
 * React component that renders the playback bar color settings panel.
 *
 * @param {object} props - Component properties.
 * @param {object} props.attributes - Block attributes.
 * @param {Function} props.setAttributes - Function to set block attributes.
 * @returns {import('react').ReactElement} - Playback bar color settings panel.
 */
export default function ColorPanel( { attributes, setAttributes } ) {
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

	const initialColorState = {
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
