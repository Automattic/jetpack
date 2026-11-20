/**
 * Internal dependencies
 */
import { describeError } from '../../helpers/describe-error';
import { PageNotice } from '../page-notice';
import type { ReactNode } from 'react';

export interface ReportErrorStateProps {
	/** The report records' request state. */
	status: { isError: boolean; error: unknown; refetch: () => unknown };
	/** The full-sentence copy for a failure that Retry can fix. */
	retryDescription: string;
	children: ReactNode;
}

/**
 * Replace a report's sections with a page notice when its records fail to load.
 *
 * @param {ReportErrorStateProps} props - The component props.
 * @return The page notice, or the report sections.
 */
export function ReportErrorState( { status, retryDescription, children }: ReportErrorStateProps ) {
	if ( ! status.isError ) {
		return <>{ children }</>;
	}

	return (
		<PageNotice
			{ ...describeError( status.error, {
				retryDescription,
				onRetry: () => void status.refetch(),
			} ) }
		/>
	);
}
