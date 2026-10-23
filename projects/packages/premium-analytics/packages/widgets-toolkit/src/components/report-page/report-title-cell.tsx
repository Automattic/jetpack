/**
 * Internal dependencies
 */
import { ViewLiveLink } from '../view-live-link';
import styles from './report-title-link.module.scss';
import type { JSX, ReactNode } from 'react';

export type ReportTitleCellProps = {
	/** The title link, which opens the row's detail page. */
	children: ReactNode;
	/**
	 * The row's public URL, straight from report data, for the trailing "View"
	 * action. A row with no public URL gets no action.
	 */
	liveUrl?: string | null;
	/** The row's title, which names the action for assistive technology. */
	label: string;
};

/**
 * A records table's title cell for a row that opens a detail page: the title
 * link, then the "View" action that opens the live content in a new tab. The
 * table row reveals the action on hover or focus, as the widget rows do.
 *
 * @param {ReportTitleCellProps} props - The component props.
 * @return The title cell.
 */
export function ReportTitleCell( { children, liveUrl, label }: ReportTitleCellProps ): JSX.Element {
	return (
		<span className={ styles.cell }>
			{ children }
			<ViewLiveLink href={ liveUrl } label={ label } className={ styles.viewAction } />
		</span>
	);
}
