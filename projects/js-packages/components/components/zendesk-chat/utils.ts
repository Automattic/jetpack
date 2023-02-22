import { DateFunctionType } from './types';

// Checks if current time is within the days chat is available
const isWithinAvailableChatDays: DateFunctionType = ( currentTime: Date ) => {
	const weekendDays = [ 0, 6 ]; // 0 is Sunday and 6 is Saturday
	const utcWeekDay = currentTime.getUTCDay();

	if ( weekendDays.includes( utcWeekDay ) ) {
		return false;
	}

	return true;
};

// Checks if the current time is within the times chat is consistently covered
const isWithinAvailableChatTimes: DateFunctionType = ( currentTime: Date ) => {
	const availableStartTime = 9; // Chat is available starting at 9:00 UTC
	const availableEndTime = 19; // Chat is no longer available after 19:00 UTC
	const currentUTCHour = currentTime.getUTCHours();

	if ( currentUTCHour >= availableStartTime && currentUTCHour < availableEndTime ) {
		return true;
	}

	return false;
};

export default { isWithinAvailableChatDays, isWithinAvailableChatTimes };
