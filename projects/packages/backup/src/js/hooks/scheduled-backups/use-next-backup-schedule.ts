import { getSettings } from '@wordpress/date';
import moment from 'moment';
import useScheduledTimeQuery from './use-scheduled-time-query';

/**
 * Converts a given hour into a time range string, either in UTC or local time.
 * The resulting time range shows a start time and an end time 59 minutes later.
 *
 * - For local times, the start time is displayed in 12-hour format without AM/PM,
 * while the end time includes AM/PM.
 * - For UTC, the time range is displayed in 24-hour format for both start and end times.
 *
 * @param {number}  hour  - The hour of the day (0-23) for which to generate the time range.
 * @param {boolean} isUtc - Whether to generate the time range in UTC (true) or local time (false).
 *
 * @return {string} - A formatted string representing the time range.
 */
const convertHourToRange = ( hour: number, isUtc: boolean = false ): string => {
	const time = isUtc
		? moment.utc().startOf( 'day' ).hour( hour )
		: moment().startOf( 'day' ).hour( hour );

	const startTimeFormat = isUtc ? 'HH:mm' : 'h:mm';
	const endTimeFormat = isUtc ? 'HH:mm' : 'h:mm A';

	const startTime = time.format( startTimeFormat );
	const endTime = time.add( 59, 'minutes' ).format( endTimeFormat );

	return `${ startTime }-${ endTime }`;
};

export const useNextBackupSchedule = () => {
	const { data, isSuccess } = useScheduledTimeQuery();

	const getNextBackupDate = () => {
		if ( ! data || data.scheduledHour === null ) {
			return null;
		}

		const currentTime = moment();
		const backupTimeUtc = moment.utc().startOf( 'day' ).hour( data.scheduledHour );

		let nextBackupDate = backupTimeUtc;
		const localDateSettings = getSettings();

		if ( localDateSettings.timezone && localDateSettings.timezone.offset ) {
			nextBackupDate = nextBackupDate.utcOffset( localDateSettings.timezone.offset );
		} else {
			nextBackupDate = backupTimeUtc.local();
		}

		const nextBackupDateEnd = nextBackupDate.clone().add( 59, 'minutes' ).add( 59, 'seconds' );

		// Only move to the next day if the current time is after the backup window
		if ( currentTime.isAfter( nextBackupDateEnd ) ) {
			nextBackupDate.add( 1, 'day' ); // Move to next day
		}

		return nextBackupDate;
	};

	const nextBackupDate = getNextBackupDate();

	if ( ! nextBackupDate ) {
		return {
			hasLoaded: isSuccess,
			date: null,
			timeRange: null,
		};
	}

	const timeRange = convertHourToRange( nextBackupDate.hour() );

	return {
		hasLoaded: isSuccess,
		nextBackupDate,
		timeRange,
	};
};
