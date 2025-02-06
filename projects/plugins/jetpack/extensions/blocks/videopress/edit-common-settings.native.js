/**
 * WordPress dependencies
 */
import { ToggleControl, SelectControl } from '@wordpress/components';
import { useMemo, useCallback } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';

const options = [
	{ value: 'auto', label: _x( 'Auto', 'VideoPress preload setting', 'jetpack' ) },
	{
		value: 'metadata',
		label: _x( 'Metadata', 'VideoPress preload setting', 'jetpack' ),
	},
	{ value: 'none', label: _x( 'None', 'VideoPress preload setting', 'jetpack' ) },
];

const VideoSettings = ( { setAttributes, attributes } ) => {
	const { autoplay, controls, loop, muted, playsinline, preload } = attributes;

	const toggleFactory = useMemo( () => {
		const toggleAttribute = attribute => {
			return newValue => {
				setAttributes( { [ attribute ]: newValue } );
			};
		};

		return {
			autoplay: toggleAttribute( 'autoplay' ),
			loop: toggleAttribute( 'loop' ),
			muted: toggleAttribute( 'muted' ),
			controls: toggleAttribute( 'controls' ),
			playsinline: toggleAttribute( 'playsinline' ),
		};
	}, [ setAttributes ] );

	const onChangePreload = useCallback(
		value => {
			setAttributes( { preload: value } );
		},
		[ setAttributes ]
	);

	return (
		<>
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Autoplay', 'jetpack' ) }
				onChange={ toggleFactory.autoplay }
				checked={ !! autoplay }
				help={ __( 'Autoplay may cause usability issues for some users.', 'jetpack' ) }
			/>
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Loop', 'jetpack' ) }
				onChange={ toggleFactory.loop }
				checked={ !! loop }
			/>
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Muted', 'jetpack' ) }
				onChange={ toggleFactory.muted }
				checked={ !! muted }
			/>
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Playback Controls', 'jetpack' ) }
				onChange={ toggleFactory.controls }
				checked={ !! controls }
			/>
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Play Inline', 'jetpack' ) }
				onChange={ toggleFactory.playsinline }
				checked={ !! playsinline }
			/>
			<SelectControl
				__nextHasNoMarginBottom
				label={ __( 'Preload', 'jetpack' ) }
				value={ preload }
				onChange={ onChangePreload }
				options={ options }
				hideCancelButton={ true }
			/>
		</>
	);
};

export default VideoSettings;
