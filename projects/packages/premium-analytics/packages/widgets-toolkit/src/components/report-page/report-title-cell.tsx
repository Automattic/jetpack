/**
 * Internal dependencies
 */
import { ViewLiveLink, toViewLiveUrl, type ViewLiveContent } from '../view-live-link';
import styles from './report-title-link.module.scss';
import type { JSX, ReactNode } from 'react';

export type ReportTitleCellProps = {
	/** The title link, which opens the row's detail page when the row has one. */
	children: ReactNode;
	/** Whether the row's detail page is a post or a video one. */
	content: ViewLiveContent;
	/** The row's post, page or video ID. */
	id?: number | string | null;
	/** The row's public URL, straight from report data. */
	link?: string | null;
	/** The row's title, which names the action for assistive technology. */
	label: string;
};

/**
 * A records table's title cell: the title link, then the "View" action that
 * opens the live content in a new tab on a row whose title opens a detail
 * page. The table row reveals the action on hover or focus, as the widget rows
 * do. A row that gets no action renders the title alone.
 *
 * @param {ReportTitleCellProps} props - The component props.
 * @return The title cell.
 */
export function ReportTitleCell( {
	children,
	content,
	id,
	link,
	label,
}: ReportTitleCellProps ): JSX.Element {
	const liveUrl = toViewLiveUrl( content, id, link );

	if ( liveUrl === undefined ) {
		return <>{ children }</>;
	}

	return (
		<span className={ styles.cell }>
			{ children }
			<ViewLiveLink href={ liveUrl } label={ label } className={ styles.viewAction } />
		</span>
	);
}
