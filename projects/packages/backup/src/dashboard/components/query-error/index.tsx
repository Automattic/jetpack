import { Button, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import './style.scss';

type Props = {
	/** What failed, in the reader's terms. */
	title: string;
	error: Error;
	/** Refetches the failed query. Omitted when the caller has no way to retry. */
	onRetry?: () => void;
	/** Whether a retry is in flight. */
	isRetrying?: boolean;
};

/**
 * Inline report for a query that failed.
 *
 * Exists because "the request failed" and "there is nothing here" are
 * indistinguishable in this dashboard by default: React Query hands back
 * an error, the consumer reads only `isLoading` and `data`, and an empty
 * `data` renders the same empty state either way. A reader whose
 * activity log 5xx'd is told their site has no activity.
 *
 * The upstream message is shown verbatim alongside the friendly line.
 * It is the only part a support agent can act on, and the bridges
 * already translate WPCOM's failures into human-readable text.
 *
 * `isRetrying` matters more than it looks. React Query defines
 * `isLoading` as `isPending && isFetching`, and a query sitting in the
 * error state is never pending — so a refetch leaves `isLoading` false
 * for its whole duration. Without a separate signal the button would not
 * change, and a retry that failed again would leave the DOM
 * byte-identical to before the click, which reads as a dead control.
 *
 * @param props            - Component props.
 * @param props.title      - What failed, in the reader's terms.
 * @param props.error      - The query's error.
 * @param props.onRetry    - Refetches the failed query, when the caller can.
 * @param props.isRetrying - Whether a retry is currently in flight.
 * @return The rendered error.
 */
export default function QueryError( { title, error, onRetry, isRetrying = false }: Props ) {
	return (
		<Notice status="error" isDismissible={ false } className="jpb-query-error">
			<Stack direction="column" gap="sm" align="flex-start">
				<Text>{ title }</Text>
				{ error.message && (
					<Text variant="body-sm" className="jpb-text-muted">
						{ error.message }
					</Text>
				) }
				{ onRetry && (
					<Button
						variant="secondary"
						size="compact"
						onClick={ onRetry }
						isBusy={ isRetrying }
						disabled={ isRetrying }
						accessibleWhenDisabled
					>
						{ __( 'Try again', 'jetpack-backup-pkg' ) }
					</Button>
				) }
			</Stack>
		</Notice>
	);
}
