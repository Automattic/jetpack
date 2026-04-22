import { __experimentalHStack as HStack } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { Icon } from '@wordpress/icons';
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
	const { activityDescription, activityIcon, activityTitle } = activity;
	const formattedContent = activityDescription.items.length
		? renderFormattedContent( { items: activityDescription.items } )
		: null;

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
				{ formattedContent && <span>{ formattedContent }</span> }
			</HStack>
		</HStack>
	);
}
