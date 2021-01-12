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
import { STATE_PAUSED, STORE_ID } from '../../../store/media-source/constants';

export default function MediaPlayerControl( {
	timestamp,
	onTimeChange,
} ) {
	const { mediaId, playerState } = useSelect( select => {
		const { getDefaultMediaSource } = select( STORE_ID );
		const mediaSource = getDefaultMediaSource();

		return {
			mediaId: mediaSource?.id,
			playerState: STATE_PAUSED,
		};
	}, [] );

	if ( ! mediaId ) {
		return null;
	}

	return (
		<ToolbarGroup>
			<ToolbarButton
				icon={ controlBackFive }
				onClick={ console.log }
			/>

			<ToolbarButton
				icon={ playerState === STATE_PAUSED
					? 'controls-play'
					: 'controls-pause'
				}
				onClick={ console.log }
			/>
			<ToolbarButton
				icon={ controlForwardFive }
				onClick={ console.log }
			/>
		</ToolbarGroup>
	);
}
