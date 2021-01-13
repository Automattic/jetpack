/* global mejs */

/**
 * External dependencies
 */
import { debounce } from 'lodash';

/**
 * WordPress dependencies
 */
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { controlBackFive, controlForwardFive } from '../../../shared/icons';
import { STATE_PAUSED, STATE_PLAYING, STORE_ID } from '../../../store/media-source/constants';

export default function MediaPlayerControl( {
	timestamp,
	onTimeChange,
} ) {
	const { mediaId, playerState, domEl } = useSelect( select => {
		const { getDefaultMediaSource, getMediaSourceCurrentTime, getMediaElementDomReference } = select( STORE_ID );
		const mediaSource = getDefaultMediaSource();
		const domRef = getMediaElementDomReference( mediaId );

		return {
			mediaId: mediaSource?.id,
			playerState: mediaSource?.state,
			currentTime: getMediaSourceCurrentTime( mediaSource?.id, true ),
			domEl: domRef && document.getElementById( domRef ),
		};
	}, [] );

	const {
		playMediaSource,
		pauseMediaSource,
		setMediaSourceCurrentTime,
	} = useDispatch( STORE_ID );

	const debouncedMoveTimestamp = useCallback( debounce( function( newCurrentTime, ref ) {
		// ref.currentTime = newCurrentTime;
		setMediaSourceCurrentTime( mediaId, newCurrentTime );
	}, 500 ), [ mediaId ] );

	const moveTimestamp = ( offset ) => {
		pauseMediaSource( mediaId );
		const newCurrentTime = mejs.Utils.timeCodeToSeconds( timestamp ) + offset;
		onTimeChange( { timestamp: mejs.Utils.secondsToTimeCode( newCurrentTime ) } );
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
						return pauseMediaSource( mediaId );
					}
					const newCurrentTime = mejs.Utils.timeCodeToSeconds( timestamp );
					domEl.currentTime = newCurrentTime;
					playMediaSource( mediaId );
				} }
			/>
			<ToolbarButton
				icon={ controlForwardFive }
				onClick={ () => moveTimestamp( 5 ) }
			/>
		</ToolbarGroup>
	);
}
