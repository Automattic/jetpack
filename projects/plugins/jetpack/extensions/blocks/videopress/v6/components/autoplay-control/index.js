/**
 * External dependencies
 */
import { PanelBody, ToggleControl, RangeControl, SandBox } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useState, useEffect, useCallback, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { debounce } from 'lodash';
/**
 * Internal dependencies
 */
import { getVideoPressUrl } from '../../../url';
import vpBlockBridge from '../../scripts/vp-block-bridge';
import dispatchPlayerAction from '../../utils/dispatcher';
import { renderControlLabelWithTooltip } from '../inspector-controls';

const debouncedOnChange = debounce( ( domElement, currentTime ) => {
	if ( ! domElement ) {
		return;
	}

	dispatchPlayerAction( domElement, 'videopress_action_set_currenttime', {
		currentTime,
	} );

	dispatchPlayerAction( domElement, 'videopress_action_play' );
	setTimeout( () => dispatchPlayerAction( domElement, 'videopress_action_pause' ), 0 );
}, 250 );

export default function AutoplayControl( { attributes, setAttributes } ) {
	const { autoplay, autoplayHovering, autoplayHoveringStart, guid } = attributes;

	const wrapperRef = useRef();

	const [ videoDuration, setVideoDuration ] = useState();

	const videoPressUrl = getVideoPressUrl( guid, {
		autoplay: false,
		muted: true,
		playsinline: false,
	} );

	// Get video preview status.
	const { preview } = useSelect(
		select => {
			return {
				preview: select( coreStore ).getEmbedPreview( videoPressUrl ) || false,
				isRequestingEmbedPreview:
					select( coreStore ).isRequestingEmbedPreview( videoPressUrl ) || false,
			};
		},
		[ videoPressUrl ]
	);

	function onChangeAutoplayHoveringStartHandler( newTimeValue ) {
		const iFrameRef = wrapperRef?.current?.querySelector( 'iframe' );
		setAttributes( { autoplayHoveringStart: newTimeValue } );
		debouncedOnChange( iFrameRef, newTimeValue );
	}

	const onVideoPressDurationChangeHandler = useCallback( ( { detail } ) => {
		if ( ! detail?.duration ) {
			return;
		}

		setVideoDuration( detail.duration );
	}, [] );

	useEffect( () => {
		window.addEventListener( 'onVideoPressDurationChange', onVideoPressDurationChangeHandler );

		return () => {
			window.removeEventListener( 'onVideoPressDurationChange', onVideoPressDurationChangeHandler );
		};
	}, [ onVideoPressDurationChangeHandler ] );

	/* translators: Tooltip describing the "autoplay-hovering" option for the VideoPress player */
	const autoplayHoveringHelp = __( 'Play automatically when hovering over it', 'jetpack' );

	return (
		<PanelBody title={ __( 'Autoplay Settings', 'jetpack' ) }>
			<ToggleControl
				label={ renderControlLabelWithTooltip(
					__( 'Autoplay', 'jetpack' ),
					/* translators: Tooltip describing the "autoplay" option for the VideoPress player */
					__( 'Start playing the video as soon as the page loads', 'jetpack' )
				) }
				onChange={ newValue => {
					setAttributes( { autoplay: newValue } );
				} }
				checked={ autoplay }
				help={
					autoplay
						? __(
								'Note: Autoplaying videos may cause usability issues for some visitors.',
								'jetpack'
						  )
						: null
				}
			/>

			{ autoplay && (
				<>
					<ToggleControl
						label={ renderControlLabelWithTooltip(
							__( 'Autoplay when hovering', 'jetpack' ),
							autoplayHoveringHelp
						) }
						onChange={ newValue => {
							setAttributes( { autoplayHovering: newValue } );
						} }
						checked={ autoplayHovering }
						help={ autoplayHoveringHelp }
					/>

					{ autoplayHovering && (
						<div ref={ wrapperRef }>
							<SandBox html={ preview?.html } scripts={ [ vpBlockBridge ] } />

							<RangeControl
								min={ 0 }
								max={ videoDuration }
								initialPosition={ 0 }
								value={ autoplayHoveringStart }
								onChange={ onChangeAutoplayHoveringStartHandler }
								withInputField={ false }
							/>
						</div>
					) }
				</>
			) }
		</PanelBody>
	);
}
