/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { redirect } from '@wordpress/route';

type VideoDetailParams = { videoId?: string };

/**
 * Whether a raw path parameter identifies a positive integer video attachment.
 *
 * @param value - The raw `videoId` path parameter.
 * @return Whether the value is a valid video ID.
 */
function isValidVideoId( value: string | undefined ): value is string {
	return !! value && /^\d+$/.test( value ) && Number( value ) > 0;
}

/**
 * Route lifecycle for the video detail page.
 *
 * The page is available only to connected sites after the initial analytics
 * sync, and only for positive integer attachment IDs.
 */
export const route = {
	beforeLoad: ( { params }: { params?: VideoDetailParams } = {} ) => {
		const connectionStatus = getScriptData()?.connection?.connectionStatus;

		if ( ! connectionStatus?.isRegistered ) {
			throw redirect( { to: '/connect' } );
		}

		const syncFinished = getScriptData()?.premium_analytics?.initial_full_sync_finished ?? 0;
		if ( ! syncFinished ) {
			throw redirect( { to: '/syncing' } );
		}

		if ( ! isValidVideoId( params?.videoId ) ) {
			throw redirect( { to: '/' } );
		}
	},
};
