import { siteHasFeature } from '@automattic/jetpack-script-data';
import { useNavigator } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as socialStore } from '../../social-store';
import { features, SHARING_ACTIVITY_TABS } from '../../utils';
import useSocialMediaConnections from '../use-social-media-connections';
import useSocialMediaMessage from '../use-social-media-message';

type SchedulePostOptions = {
	/** The timestamp to schedule the share for. */
	timestamp: number;
};

/**
 * Hook to schedule a post for sharing to social media connections.
 *
 * @return Object containing schedule functionality and state.
 */
export function useSchedulePost() {
	const { scheduleShares, openUnifiedModal } = useDispatch( socialStore );
	const { message } = useSocialMediaMessage();
	const { enabledConnections } = useSocialMediaConnections();
	const navigator = useNavigator();

	const openSharingActivity = useCallback( () => {
		// Just in case the modal is closed, we open it first.
		openUnifiedModal( {
			initialPath: '/sharing-activity',
			data: { sharingActivity: { initialTab: SHARING_ACTIVITY_TABS.SCHEDULED } },
		} );

		// Now do the navigation if it's already open.
		navigator.goTo( '/sharing-activity' );
	}, [ navigator, openUnifiedModal ] );

	return useCallback(
		async ( { timestamp }: SchedulePostOptions ) => {
			const connectionIds = enabledConnections.map( connection =>
				Number( connection.connection_id )
			);

			const actions = [
				{
					label: __( 'View', 'jetpack-publicize-pkg' ),
					onClick: openSharingActivity,
				},
			];

			/**
			 * The share endpoint only gets the custom message as a parameter, the attached media and
			 * SIG is saved to the post meta and will be read on wpcom. Because of that we need to save
			 * the post before sharing it, if it has the media features to make sure we use the latest data.
			 */
			const savePost =
				siteHasFeature( features.IMAGE_GENERATOR ) ||
				siteHasFeature( features.ENHANCED_PUBLISHING );

			return await scheduleShares( { connectionIds, message, timestamp }, { savePost, actions } );
		},
		[ enabledConnections, message, openSharingActivity, scheduleShares ]
	);
}
