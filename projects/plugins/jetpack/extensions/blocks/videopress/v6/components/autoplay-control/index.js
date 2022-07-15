/**
 * External dependencies
 */
import { PanelBody, ToggleControl, RangeControl } from '@wordpress/components';
import { useState, useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { debounce } from 'lodash';
import dispatchPlayerAction from '../../utils/dispatcher';
/**
 * Internal dependencies
 */
import { renderControlLabelWithTooltip } from '../inspector-controls';

const debouncedOnChange = debounce( ( domElement, currentTime ) => {
	if ( ! domElement ) {
		return;
	}

	dispatchPlayerAction( domElement, 'videopress_action_set_currenttime', {
		currentTime,
	} );
}, 250 );

export default function AutoplayControl( { attributes, setAttributes, wrapperRef } ) {
	const { autoplay, autoplayHovering, autoplayHoveringStart } = attributes;

	const [ videoDuration, setVideoDuration ] = useState();

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
						<RangeControl
							label={ __( 'Time start position', 'jetpack' ) }
							min={ 0 }
							max={ videoDuration }
							initialPosition={ 0 }
							value={ autoplayHoveringStart }
							onChange={ onChangeAutoplayHoveringStartHandler }
							withInputField={ false }
						/>
					) }
				</>
			) }
		</PanelBody>
	);
}
