/**
 * Generic chart datum entry type from visx tooltip data.
 * Both line and bar charts use this structure.
 */
export type ChartDatumEntry< T = unknown > = {
	datum: T;
	index: number;
	key: string;
};

/**
 * Type guard to check if an entry is a valid chart datum entry.
 *
 * @param entry - The entry to check.
 * @return True if the entry has the expected structure.
 */
export const isChartDatumEntry = < T >( entry: unknown ): entry is ChartDatumEntry< T > => {
	return (
		typeof entry === 'object' &&
		entry !== null &&
		'datum' in entry &&
		'index' in entry &&
		'key' in entry
	);
};
