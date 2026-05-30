import { __experimentalHStack as HStack } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { Icon } from '@wordpress/icons';
import { buildObjectAdminLink } from './admin-links';
import { renderFormattedContent } from './formatted-block';
import { gridiconToWordPressIcon } from './gridicons';
import type { Activity } from './types';
import './activity-event.scss';

/**
 * Just the gridicon for an activity row. Exposed as its own component
 * so the Activity layout can mount it in DataViews' `mediaField` slot
 * (rendering left-aligned outside the title block).
 *
 * @param props          - Component props.
 * @param props.activity - Normalized Activity for the current log row.
 * @return The icon element, or null when the activity has none.
 */
export function ActivityEventIcon( { activity }: { activity: Activity } ) {
	const { activityIcon } = activity;
	if ( ! activityIcon ) {
		return null;
	}
	return (
		<Icon
			className="site-activity-logs__event-icon"
			icon={ gridiconToWordPressIcon( activityIcon ) }
			size={ 24 }
		/>
	);
}

/**
 * Just the bold activity title (e.g. "Plugin activated"). Plugged into
 * DataViews' `titleField` slot for the Activity layout.
 *
 * @param props          - Component props.
 * @param props.activity - Normalized Activity for the current log row.
 * @return The title element.
 */
export function ActivityEventTitle( { activity }: { activity: Activity } ) {
	// `.site-activity-logs__event-title` both lightens the default
	// `<strong>` font-weight to 500 *and* — because the class is on a
	// non-span element — keeps the `> span { color: grey }` rule on the
	// enclosing `.site-activity-logs__event-content` from dimming the
	// title in the Table layout.
	return <strong className="site-activity-logs__event-title">{ activity.activityTitle }</strong>;
}

/**
 * The formatted description body — parsed ranges (entity links,
 * release-notes, etc.) with an `object`-level link fallback for
 * range-less payloads like `post__published`. Plugs into DataViews'
 * `descriptionField` slot for the Activity layout.
 *
 * @param props          - Component props.
 * @param props.activity - Normalized Activity for the current log row.
 * @return The description element, or null when the activity has none.
 */
export function ActivityEventDescription( { activity }: { activity: Activity } ) {
	const { activityDescription, activityObject } = activity;
	const hasRanges = activityDescription.items.some(
		item => typeof item === 'object' && item !== null && 'type' in item
	);
	const objectHref = hasRanges ? null : buildObjectAdminLink( activityObject );
	const formattedContent = activityDescription.items.length
		? renderFormattedContent( { items: activityDescription.items } )
		: null;
	if ( ! formattedContent ) {
		return null;
	}
	return (
		<span>{ objectHref ? <a href={ objectHref }>{ formattedContent }</a> : formattedContent }</span>
	);
}

/**
 * DataViews cell renderer for the Table layout's "Event" column.
 * Composes the icon, title, and description into a single cell. The
 * Activity layout uses the three sub-components directly in their
 * respective field slots instead.
 *
 * @param props          - Component props.
 * @param props.activity - Normalized Activity for the current log row.
 * @return The event cell.
 */
export function ActivityEvent( { activity }: { activity: Activity } ) {
	return (
		<HStack spacing="2" alignment="left" className="site-activity-logs__event">
			<ActivityEventIcon activity={ activity } />
			<HStack
				spacing="1"
				justify="flex-start"
				alignment="start"
				className="site-activity-logs__event-content"
			>
				<ActivityEventTitle activity={ activity } />
				<ActivityEventDescription activity={ activity } />
			</HStack>
		</HStack>
	);
}
