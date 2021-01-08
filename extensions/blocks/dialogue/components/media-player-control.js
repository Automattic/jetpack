/* global mejs */

/**
 * External dependencies
 */
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { controlBackFive, controlForwardFive } from '../../../shared/icons';
import { STORE_ID } from '../../../store/media-source';

export default function MediaPlayerControl( {
	timestamp,
	onTimeChange,
} ) {
	const { mediaId, status } = useSelect( select => {
		const { getCurrent, getMediaStatus, getCurrentMediaId } = select( STORE_ID );
		const currentMediaId = getCurrentMediaId();
		return {
			mediaId: currentMediaId,
			currentMediaSource: getCurrent(),
			status: getMediaStatus( currentMediaId ),
		};
	}, [] );

	const { toggleMediaSource, setMediaPosition } = useDispatch( STORE_ID );
	const toggleMedia = () => toggleMediaSource( mediaId );
	const moveOffset = ( offset ) => {
		let pos = mejs.Utils.timeCodeToSeconds( timestamp ) + offset;
		if ( pos < 0 ) {
			pos = 0;
		}

		onTimeChange( { timestamp: mejs.Utils.secondsToTimeCode( pos ) } );
		setMediaPosition( mediaId, pos );
	};

	return (
		<ToolbarGroup>
			<ToolbarButton
				icon={ controlBackFive }
				onClick={ () => moveOffset( -5 ) }
			/>

			<ToolbarButton
				icon={ status === 'is-paused'
					? 'controls-play'
					: 'controls-pause'
				}
				onClick={ toggleMedia }
			/>
			<ToolbarButton
				icon={ controlForwardFive }
				onClick={ () => moveOffset( 5 ) }
			/>
		</ToolbarGroup>
	);
}
