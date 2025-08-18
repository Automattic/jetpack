/**
 * Calculate progress percentage for form progress indicator
 *
 * @param {number}  currentStep - Current step number (1-based)
 * @param {number}  totalSteps  - Total number of steps
 * @param {boolean} isDotStyle  - Whether using dots style or line style
 * @return {number} Progress percentage (0-100)
 */
export const calculateProgressPercentage = ( currentStep, totalSteps, isDotStyle = false ) => {
	if ( totalSteps <= 0 ) {
		return 0;
	}

	if ( isDotStyle ) {
		// For dots: show progress between dots based on completed steps
		const completedSteps = Math.max( 0, currentStep - 1 );
		return totalSteps > 1 ? ( completedSteps / ( totalSteps - 1 ) ) * 100 : 0;
	}

	// For line: show progress to current step
	return ( Math.max( 1, currentStep ) / totalSteps ) * 100;
};
