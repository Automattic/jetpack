/* global mejs */

/**
 * External dependencies
 */
import { debounce } from 'lodash';

/**
 * WordPress dependencies
 */
import { ToolbarGroup, ToolbarButton, ToolbarItem } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { controlBackFive, controlForwardFive } from '../../../shared/icons';
import { STATE_PAUSED, STATE_PLAYING, STORE_ID } from '../../../store/media-source/constants';

export default function MediaPlayerControl( { time, onTimeChange } ) {
	const { mediaId, playerState, domEl, currentTime } = useSelect( select => {
		const { getDefaultMediaSource, getMediaSourceCurrentTime, getMediaElementDomReference } = select( STORE_ID );
		const mediaSource = getDefaultMediaSource();
		const domRef = getMediaElementDomReference( mediaId );

		return {
			mediaId: mediaSource?.id,
			playerState: mediaSource?.state,
			currentTime: getMediaSourceCurrentTime( mediaSource?.id ),
			domEl: domRef && document.getElementById( domRef ),
		};
	}, [] );

	const {
		playMediaSource,
		pauseMediaSource,
		setMediaSourceCurrentTime,
	} = useDispatch( STORE_ID );

	const debouncedMoveTimestamp = useCallback(
		debounce( function( newCurrentTime, ref ) {
			// ref.currentTime = newCurrentTime;
			setMediaSourceCurrentTime( mediaId, newCurrentTime );
			// playMediaSource( mediaId );
		}, 500 )
	, [ mediaId ] );

	const moveTimestamp = ( offset ) => {
		// pauseMediaSource( mediaId );
		const newCurrentTime = mejs.Utils.timeCodeToSeconds( time ) + offset;
		onTimeChange( mejs.Utils.secondsToTimeCode( newCurrentTime ) );
		debouncedMoveTimestamp( newCurrentTime, domEl );
	};

	if ( ! mediaId ) {
		return null;
	}

	return (
		<ToolbarGroup>
			<ToolbarButton
				icon={ controlBackFive }
				onClick={ () => moveTimestamp( -5 ) }
			/>

			<ToolbarButton
				icon={ playerState === STATE_PAUSED
					? 'controls-play'
					: 'controls-pause'
				}
				onClick={ () => {
					if ( playerState === STATE_PLAYING ) {
						domEl.pause();
						return pauseMediaSource( mediaId );
					}
					const newCurrentTime = mejs.Utils.timeCodeToSeconds( time );
					// domEl.currentTime = newCurrentTime;
					// domEl.play();

					setMediaSourceCurrentTime( mediaId, newCurrentTime );
					playMediaSource( mediaId );
				} }
			/>
			<ToolbarButton
				icon={ controlForwardFive }
				onClick={ () => moveTimestamp( 5 ) }
			/>

		<ToolbarButton className="media-player-control__current-time">
			{ mejs.Utils.secondsToTimeCode( currentTime ) }
		</ToolbarButton>
		</ToolbarGroup>
	);
}
