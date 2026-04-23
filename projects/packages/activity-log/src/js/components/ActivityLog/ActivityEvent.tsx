import { __experimentalHStack as HStack } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { Icon } from '@wordpress/icons';
import { buildObjectAdminLink } from './admin-links';
import { renderFormattedContent } from './formatted-block';
import { gridiconToWordPressIcon } from './gridicons';
import type { Activity } from './types';
import './activity-event.scss';

/**
 * DataViews cell renderer for the "Event" column. Composes the gridicon,
 * activity title, and formatted description into the row's main content.
 *
 * @param props          - Component props.
 * @param props.activity - Normalized Activity for the current log row.
 * @return The event cell.
 */
export function ActivityEvent( { activity }: { activity: Activity } ) {
	const { activityDescription, activityIcon, activityObject, activityTitle } = activity;

	const hasRanges = activityDescription.items.some(
		item => typeof item === 'object' && item !== null && 'type' in item
	);

	// Token-level links inside the description are produced by
	// FormattedBlock. When the description has no ranges at all — e.g. a
	// post__published event where `content.text` is literally the post
	// title — fall back to the entry-level `object` and wrap the whole
	// description in a link.
	const objectHref = hasRanges ? null : buildObjectAdminLink( activityObject );

	const formattedContent = activityDescription.items.length
		? renderFormattedContent( { items: activityDescription.items } )
		: null;

	const descriptionNode =
		formattedContent &&
		( objectHref ? <a href={ objectHref }>{ formattedContent }</a> : formattedContent );

	return (
		<HStack spacing="2" alignment="left" className="site-activity-logs__event">
			{ activityIcon && (
				<Icon
					className="site-activity-logs__event-icon"
					icon={ gridiconToWordPressIcon( activityIcon ) }
					size={ 24 }
				/>
			) }
			<HStack
				spacing="1"
				justify="flex-start"
				alignment="start"
				className="site-activity-logs__event-content"
			>
				<strong className="site-activity-logs__event-title">{ activityTitle }</strong>
				{ descriptionNode && <span>{ descriptionNode }</span> }
			</HStack>
		</HStack>
	);
}
