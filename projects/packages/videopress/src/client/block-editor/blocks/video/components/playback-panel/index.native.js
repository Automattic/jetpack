/**
 *External dependencies
 */
import { useNavigation } from '@react-navigation/native';
import { PanelBody, ToggleControl, BottomSheet } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, chevronRight } from '@wordpress/icons';
import { Text } from 'react-native';

/**
 * Sidebar Control component.
 *
 * @param {object} props - Component props.
 * @param {object} props.attributes - Block attributes.
 * @param {Function} props.setAttributes - Function to set attributes.
 * @returns {import('react').ReactElement} - Playback block sidebar panel
 */
export default function PlaybackPanel( { attributes, setAttributes } ) {
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

	const { autoplay, loop, muted, controls, playsinline, preload, posterData } = attributes;

	// Is Preview On Hover effect enabled?
	const isPreviewOnHoverEnabled = posterData?.previewOnHover;

	const handleAttributeChange = useCallback(
		( attributeName, attributeValue ) => {
			return newValue => {
				setAttributes( { [ attributeName ]: attributeValue ?? newValue } );
			};
		},
		[ setAttributes ]
	);

	const AutoplayHelp = () => {
		/*
		 * If the preview on hover effect is enabled,
		 * we want to let the user know that the autoplay
		 * option is not available.
		 */
		if ( isPreviewOnHoverEnabled ) {
			return (
				<Text>
					{ __(
						'Autoplay is turned off as the preview on hover is active.',
						'jetpack-videopress-pkg'
					) }
				</Text>
			);
		}

		return (
			<>
				<Text>
					{ __( 'Start playing the video as soon as the page loads.', 'jetpack-videopress-pkg' ) }
				</Text>
				{ autoplay && (
					<Text>
						{ '\n\n' +
							__(
								'Note: Autoplaying videos may cause usability issues for some visitors.',
								'jetpack-videopress-pkg'
							) }
					</Text>
				) }
			</>
		);
	};

	return (
		<BottomSheet.SubSheet
			navigationButton={
				<BottomSheet.Cell
					label={ __( 'Playback Settings', 'jetpack-videopress-pkg' ) }
					onPress={ openSubSheet }
					leftAlign
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
						{ __( 'Playback Settings', 'jetpack-videopress-pkg' ) }
					</BottomSheet.NavBar.Heading>
				</BottomSheet.NavBar>

				<PanelBody>
					<ToggleControl
						label={ __( 'Autoplay', 'jetpack-videopress-pkg' ) }
						onChange={ handleAttributeChange( 'autoplay' ) }
						checked={ autoplay && ! isPreviewOnHoverEnabled }
						disabled={ isPreviewOnHoverEnabled }
						help={ <AutoplayHelp /> }
					/>

					<ToggleControl
						label={ __( 'Loop', 'jetpack-videopress-pkg' ) }
						onChange={ handleAttributeChange( 'loop' ) }
						checked={ loop }
						help={ __( 'Restarts the video when it reaches the end.', 'jetpack-videopress-pkg' ) }
					/>

					<ToggleControl
						label={ __( 'Muted', 'jetpack-videopress-pkg' ) }
						onChange={ handleAttributeChange( 'muted' ) }
						checked={ muted }
					/>

					<ToggleControl
						label={ __( 'Show Controls', 'jetpack-videopress-pkg' ) }
						onChange={ handleAttributeChange( 'controls' ) }
						checked={ controls }
						help={ __( 'Display the video playback controls.', 'jetpack-videopress-pkg' ) }
					/>

					<ToggleControl
						label={ __( 'Play Inline', 'jetpack-videopress-pkg' ) }
						onChange={ handleAttributeChange( 'playsinline' ) }
						checked={ playsinline }
						help={ __(
							'Play the video inline instead of full-screen on mobile devices.',
							'jetpack-videopress-pkg'
						) }
					/>

					<ToggleControl
						label={ __( 'Preload Metadata', 'jetpack-videopress-pkg' ) }
						onChange={ handleAttributeChange(
							'preload',
							preload === 'metadata' ? 'none' : 'metadata'
						) }
						checked={ preload === 'metadata' }
						help={ __(
							'Preload the video metadata when the page is loaded.',
							'jetpack-videopress-pkg'
						) }
					/>
				</PanelBody>
			</>
		</BottomSheet.SubSheet>
	);
}
