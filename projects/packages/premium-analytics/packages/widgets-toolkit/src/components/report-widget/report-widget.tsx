/**
 * External dependencies
 */
import { describeError, useGlobalError } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { WidgetState, type WidgetStateEmpty } from '../widget-state';
import type { ReactNode } from 'react';

interface ReportLike {
	isLoading: boolean;
	isFetching: boolean;
	isError: boolean;
	error: unknown;
	refetch?: () => void;
}

export interface ReportWidgetProps< R extends ReportLike, Row > {
	/** The normalized report/view result (already fetched inside `<WidgetRoot>`). */
	report: R;
	/** The rows the widget will render; `rows.length === 0` drives the empty state. */
	rows: Row[];
	empty?: WidgetStateEmpty;
	/** Body chrome kept visible across every state (dropdowns, back links). */
	toolbar?: ReactNode;
	renderLoading?: ReactNode;
	onUpgrade?: () => void;
	children: ( rows: Row[] ) => ReactNode;
}

/**
 * Convenience wrapper for the common report-backed widget. Maps a report to the
 * four `<WidgetState>` signals, wires Retry to `report.refetch`, applies the
 * page-level global error as a muted state, and keeps `toolbar` visible as a
 * sibling of the state region.
 *
 * @param props               - Component props.
 * @param props.report        - The normalized report/view result.
 * @param props.rows          - The rows the widget will render.
 * @param props.empty         - Empty-state descriptor passed through to `<WidgetState>`.
 * @param props.toolbar       - Body chrome kept visible across every state.
 * @param props.renderLoading - Optional per-widget loading override.
 * @param props.onUpgrade     - Called when the error state's "Upgrade" action is clicked.
 * @param props.children      - Render prop for the success content, given the rows.
 * @return The rendered widget.
 */
export function ReportWidget< R extends ReportLike, Row >( {
	report,
	rows,
	empty,
	toolbar,
	renderLoading,
	onUpgrade,
	children,
}: ReportWidgetProps< R, Row > ) {
	const { isGlobalError } = useGlobalError();

	const error = isGlobalError
		? { description: '' } // muted: the page-level tier owns the banner
		: describeError( report.error, { onRetry: report.refetch, onUpgrade } );

	return (
		<>
			{ toolbar }
			<WidgetState
				isLoading={ report.isLoading }
				isFetching={ report.isFetching }
				isError={ report.isError || isGlobalError }
				isEmpty={ rows.length === 0 }
				error={ error }
				empty={ empty }
				renderLoading={ renderLoading }
			>
				{ children( rows ) }
			</WidgetState>
		</>
	);
}
