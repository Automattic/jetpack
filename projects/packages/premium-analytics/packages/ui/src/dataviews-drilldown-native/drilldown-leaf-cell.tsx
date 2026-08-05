/**
 * External dependencies
 */
import { VisuallyHidden } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
import styles from './drilldown-leaf-cell.module.scss';
import type { ReactNode } from 'react';

export interface DrilldownLeafCellProps {
	/**
	 * The parent group's label. DataViews' native hierarchy conveys the
	 * group/child relationship visually only (indentation, no `aria-level`),
	 * so nested rows announce their group to screen readers here.
	 */
	groupLabel?: string;
	/**
	 * The cell content: plain text, an external `Link` from `@wordpress/ui`,
	 * or an internal router link — the cell restores the link treatment for
	 * any composed anchor.
	 */
	children: ReactNode;
}

/**
 * Title-field cell shell for a drilldown leaf row.
 *
 * DataViews styles every title-field cell as a medium-weight neutral title,
 * but in a drilldown table only group parent rows are titles. Field renders
 * return group rows bare (so the native title styling applies) and wrap leaf
 * rows in this shell, which opts back out to body weight and restores the
 * link treatment DataViews' title styling suppresses. The link itself is
 * composed by the consumer — an external `Link` or an internal router link.
 *
 * @param {DrilldownLeafCellProps} props - The component props.
 * @return The leaf cell shell.
 */
export function DrilldownLeafCell( { groupLabel, children }: DrilldownLeafCellProps ) {
	return (
		<span className={ styles.leaf }>
			{ groupLabel ? <VisuallyHidden>{ `${ groupLabel }: ` }</VisuallyHidden> : null }
			{ children }
		</span>
	);
}
