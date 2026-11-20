import { format, getDate, getSettings, humanTimeDiff } from '@wordpress/date';
import { Tooltip } from '@wordpress/ui';

interface ReadableTimeProps {
	/**
	 * Unix timestamp in seconds.
	 */
	timestamp: number;
}

/**
 * Displays a human-readable time difference with a tooltip showing the full date.
 *
 * @param {ReadableTimeProps} props - Component props.
 * @return React element.
 */
export function ReadableTime( { timestamp }: ReadableTimeProps ) {
	return (
		<Tooltip.Root>
			<Tooltip.Trigger render={ <span /> }>
				{
					// "7 days from now" or "3 hours ago"
					humanTimeDiff( timestamp * 1000, getDate( null ) )
				}
			</Tooltip.Trigger>
			<Tooltip.Popup>
				{
					// E.g. "January 20, 2026 1:44 pm"
					format( getSettings().formats.datetime, timestamp * 1000 )
				}
			</Tooltip.Popup>
		</Tooltip.Root>
	);
}
