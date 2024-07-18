/*
 * Converts a number to an ordinal string.
 * Used to inform the AI model of the position of the right word in a sentence.
 */
export const numberToOrdinal = ( number: number ) => {
	const suffix = [ 'th', 'st', 'nd', 'rd' ];
	const lastTwoDigits = number % 100;

	return (
		number + ( suffix[ ( lastTwoDigits - 20 ) % 10 ] || suffix[ lastTwoDigits ] || suffix[ 0 ] )
	);
};
