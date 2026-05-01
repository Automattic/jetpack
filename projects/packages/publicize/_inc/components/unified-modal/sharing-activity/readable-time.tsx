import { Tooltip } from '@wordpress/components';
import { format, getDate, getSettings, humanTimeDiff } from '@wordpress/date';

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
		<Tooltip
			// E.g. "January 20, 2026 1:44 pm"
			text={ format( getSettings().formats.datetime, timestamp * 1000 ) }
		>
			<span>
				{
					// "7 days from now" or "3 hours ago"
					humanTimeDiff( timestamp * 1000, getDate( null ) )
				}
			</span>
		</Tooltip>
	);
}
