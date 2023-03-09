/**
 * WordPress dependencies
 */
import { ToggleControl, SelectControl } from '@wordpress/components';
import { useMemo, useCallback, Platform } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';

const options = [
	{ value: 'auto', label: __( 'Auto', 'jetpack' ) },
	{ value: 'metadata', label: __( 'Metadata', 'jetpack' ) },
	{ value: 'none', label: _x( 'None', 'Preload value', 'jetpack' ) },
];

const VideoSettings = ( { setAttributes, attributes } ) => {
	const { autoplay, controls, loop, muted, playsInline, preload } = attributes;

	const autoPlayHelpText = __( 'Autoplay may cause usability issues for some users.', 'jetpack' );
	const getAutoplayHelp = Platform.select( {
		web: useCallback( checked => {
			return checked ? autoPlayHelpText : null;
		}, [] ),
		native: autoPlayHelpText,
	} );

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
			playsInline: toggleAttribute( 'playsInline' ),
		};
	}, [] );

	const onChangePreload = useCallback( value => {
		setAttributes( { preload: value } );
	}, [] );

	return (
		<>
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Autoplay', 'jetpack' ) }
				onChange={ toggleFactory.autoplay }
				checked={ !! autoplay }
				help={ getAutoplayHelp }
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
				label={ __( 'Playback controls', 'jetpack' ) }
				onChange={ toggleFactory.controls }
				checked={ !! controls }
			/>
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Play inline', 'jetpack' ) }
				onChange={ toggleFactory.playsInline }
				checked={ !! playsInline }
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
