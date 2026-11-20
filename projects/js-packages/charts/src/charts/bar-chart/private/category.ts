import type { DataPointDate } from '../../../types';

/**
 * Whether two data points sit at the same category: the same label, or the same date.
 *
 * @param point    - A data point.
 * @param category - The data point naming the category.
 * @return Whether `point` is at `category`.
 */
export function isSameCategory( point: DataPointDate, category: DataPointDate ): boolean {
	// An empty label falls back to the date, as the band axis's accessor does.
	return category.label
		? point.label === category.label
		: !! category.date && !! point.date && point.date.getTime() === category.date.getTime();
}

/**
 * The category a data point sits at, as a key two points share when `isSameCategory` holds.
 *
 * @param point - A data point.
 * @return The category key.
 */
export function categoryKey( point: DataPointDate ): string {
	return point.label ? `label:${ point.label }` : `date:${ point.date?.getTime() }`;
}
