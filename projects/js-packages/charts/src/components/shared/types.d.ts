export type DataPoint = {
	label: string;
	value: number;
};

export type DataPointDate = {
	date: Date;
	value: number;
};

export type DataPointPercentage = {
	/**
	 * Label for the data point
	 */
	label: string;
	/**
	 * Numerical value
	 */
	value: number;
	/**
	 * Formatted value for display
	 */
	valueDisplay?: string;
	/**
	 * Percentage value
	 */
	percentage: number;
	/**
	 * Color code for the segment
	 */
	color?: string;
};
