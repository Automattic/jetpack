/**
 * External dependencies
 */
import { Button, EmptyState } from '@jetpack-premium-analytics/externals';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { ReportPageSection } from './report-page-layout';

export interface ReportErrorStateProps {
	title: string;
	description?: string;
	onRetry: () => void;
}

/**
 * Replace report sections with a shared error and retry state.
 *
 * The error state replaces the report sections rather than sitting beside
 * them. `ReportRecordsTable`'s `empty` renders on row count, not fetch status,
 * so a failed refetch over cached rows would otherwise leave stale data on
 * screen with no notice and no way to retry.
 *
 * @param {ReportErrorStateProps} props - The component props.
 * @return The report error state.
 */
export function ReportErrorState( {
	title,
	description = __(
		"We couldn't load this data. Please try again in a moment.",
		'jetpack-premium-analytics-pkg'
	),
	onRetry,
}: ReportErrorStateProps ) {
	return (
		<ReportPageSection>
			<EmptyState.Root>
				<EmptyState.Title>{ title }</EmptyState.Title>
				<EmptyState.Description>{ description }</EmptyState.Description>
				<EmptyState.Actions>
					<Button onClick={ onRetry }>{ __( 'Retry', 'jetpack-premium-analytics-pkg' ) }</Button>
				</EmptyState.Actions>
			</EmptyState.Root>
		</ReportPageSection>
	);
}
