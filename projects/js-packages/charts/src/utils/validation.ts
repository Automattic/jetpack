import type { SeriesData, DataPointPercentage, DataPointDate, DataPoint } from '../types';

/**
 * Validation result interface
 */
export interface ValidationResult {
	isValid: boolean;
	message?: string;
}

/**
 * Validates SeriesData for charts that use series-based data (Line Chart, Bar Chart)
 * @param data - The series data to validate
 * @return Error message if invalid, null if valid
 */
export function validateSeriesData( data: SeriesData[] ): string | null {
	if ( ! data?.length ) return 'No data available';

	const hasInvalidData = data.some( series =>
		series.data.some(
			( point: DataPointDate | DataPoint ) =>
				isNaN( point.value as number ) ||
				point.value === null ||
				point.value === undefined ||
				( 'date' in point && point.date && isNaN( point.date.getTime() ) ) ||
				( ! ( 'date' in point ) && ! ( 'label' in point ) )
		)
	);

	if ( hasInvalidData ) {
		return 'Invalid data: Please check that all data points have valid values and dates/labels';
	}

	return null;
}

/**
 * Validates DataPointPercentage for charts that use percentage-based data (Pie Chart, Pie Semi-Circle Chart)
 * @param data            - The percentage data to validate
 * @param requireTotal100 - Whether to require the total percentage to equal 100%
 * @return Validation result with isValid and optional message
 */
export function validatePercentageData(
	data: DataPointPercentage[],
	requireTotal100 = false
): ValidationResult {
	if ( ! data.length ) {
		return { isValid: false, message: 'No data available' };
	}

	// Check for negative values
	const hasNegativeValues = data.some( item => item.percentage < 0 || item.value < 0 );
	if ( hasNegativeValues ) {
		return { isValid: false, message: 'Invalid data: Negative values are not allowed' };
	}

	// Check for invalid values
	const hasInvalidValues = data.some(
		item =>
			isNaN( item.percentage ) ||
			isNaN( item.value ) ||
			item.percentage === null ||
			item.value === null ||
			item.percentage === undefined ||
			item.value === undefined
	);
	if ( hasInvalidValues ) {
		return {
			isValid: false,
			message:
				'Invalid data: Please check that all data points have valid percentage and value numbers',
		};
	}

	// Validate total percentage (for pie charts that require 100%)
	if ( requireTotal100 ) {
		const totalPercentage = data.reduce( ( sum, item ) => sum + item.percentage, 0 );
		if ( Math.abs( totalPercentage - 100 ) > 0.01 ) {
			// Using small epsilon for floating point comparison
			return { isValid: false, message: 'Invalid percentage total: Must equal 100' };
		}
	}

	return { isValid: true };
}

/**
 * Validates DataPointPercentage for semi-circle charts (requires total > 0, not necessarily 100%)
 * @param data - The percentage data to validate
 * @return Validation result with isValid and optional message
 */
export function validateSemiCircleData( data: DataPointPercentage[] ): ValidationResult {
	const basicValidation = validatePercentageData( data, false );
	if ( ! basicValidation.isValid ) {
		return basicValidation;
	}

	// Validate total percentage is greater than 0
	const totalPercentage = data.reduce( ( sum, item ) => sum + item.percentage, 0 );
	if ( totalPercentage <= 0 ) {
		return { isValid: false, message: 'Invalid percentage total: Must be greater than 0' };
	}

	return { isValid: true };
}

/**
 * Validates data for Bar Chart with additional label requirements
 * @param data - The series data to validate
 * @return Error message if invalid, null if valid
 */
export function validateBarChartData( data: SeriesData[] ): string | null {
	if ( ! data?.length ) return 'No data available';

	const hasInvalidData = data.some( series =>
		series.data.some(
			( point: DataPointDate | DataPoint ) =>
				isNaN( point.value as number ) ||
				point.value === null ||
				point.value === undefined ||
				( ! ( 'label' in point ) &&
					( ! ( 'date' in point && point.date ) || isNaN( point.date.getTime() ) ) )
		)
	);

	if ( hasInvalidData ) {
		return 'Invalid data: Please check that all data points have valid values and labels or dates';
	}

	return null;
}
