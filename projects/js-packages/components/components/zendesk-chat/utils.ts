import { DateFunctionType } from './types';

// Checks if current time is within the days chat is available
const isWithinAvailableChatDays: DateFunctionType = ( currentTime: Date ) => {
	const [ SUNDAY, SATURDAY ] = [ 0, 6 ];
	const utcWeekDay = currentTime.getUTCDay();

	if ( utcWeekDay !== SUNDAY && utcWeekDay !== SATURDAY ) {
		return true;
	}

	return false;
};

// Checks if the current time is within the times chat is consistently covered
const isWithinAvailableChatTimes: DateFunctionType = ( currentTime: Date ) => {
	const availableStartTime = 9; // Chat is available starting at 9:00 UTC
	const availableEndTime = 23; // Chat is no longer available after 23:00 UTC
	const currentUTCHour = currentTime.getUTCHours();

	if ( currentUTCHour >= availableStartTime && currentUTCHour < availableEndTime ) {
		return true;
	}

	return false;
};

export default { isWithinAvailableChatDays, isWithinAvailableChatTimes };
