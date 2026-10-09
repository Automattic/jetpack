import { __ } from '@wordpress/i18n';
import { EVENTS, recordAiHubEvent } from './tracks';

/**
 * Description for the Activity log row, matching what its link opens.
 *
 * @param {boolean} filtered - Whether the link opens filtered to AI agent actions.
 * @return {string} The row description.
 */
export const getActivityLogDescription = filtered =>
	filtered
		? __( 'Review recent actions taken by AI agents on your site.', 'jetpack' )
		: __( 'Review recent actions on your site.', 'jetpack' );

/**
 * Click handler that records a visit through the Activity log row.
 *
 * @param {boolean} filtered - Whether the link opens filtered to AI agent actions.
 * @return {Function} The click handler.
 */
export const onActivityLogClick = filtered => () =>
	recordAiHubEvent( EVENTS.LINK_CLICK, {
		link_type: 'activity_log',
		link: 'activity_log',
		filtered: filtered ? 'true' : 'false',
	} );
