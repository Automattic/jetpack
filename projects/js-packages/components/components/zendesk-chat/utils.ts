import { DateFunctionType } from './types';

// Checks if current time is within the days chat is available
export const isWithinAvailableChatDays: DateFunctionType = ( currentTime: Date ) => {
	const [ SUNDAY, SATURDAY ] = [ 0, 6 ];
	const utcWeekDay = currentTime.getUTCDay();

	if ( utcWeekDay !== SUNDAY && utcWeekDay !== SATURDAY ) {
		return true;
	}

	return false;
};

// Checks if the current time is within the times chat is consistently covered
export const isWithinAvailableChatTimes: DateFunctionType = ( currentTime: Date ) => {
	const availableStartTime = 9; // Chat is available starting at 9:00 UTC
	const availableEndTime = 23; // Chat is no longer available after 23:00 UTC
	const currentUTCHour = currentTime.getUTCHours();

	if ( currentUTCHour >= availableStartTime && currentUTCHour < availableEndTime ) {
		return true;
	}

	return false;
};

// Checks if the current time is within chat shutdown days
export const isWithinShutdownDates: DateFunctionType = ( currentTime: Date ) => {
	const startTime = new Date( Date.UTC( 2022, 11, 23 ) ); // Thu Dec 22 2022 19:00:00 (7:00pm) GMT-0500 (Eastern Standard Time)
	const endTime = new Date( Date.UTC( 2023, 0, 2 ) ); // Sun Jan 01 2023 19:00:00 (7:00pm) GMT-0500 (Eastern Standard Time)
	const currentDateUTC = new Date( currentTime.toUTCString() );

	if ( currentDateUTC > startTime && currentDateUTC < endTime ) {
		return true;
	}
	return false;
};
