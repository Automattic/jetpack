import { Button } from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Notice, Stack, Text } from '@wordpress/ui';
import { useLcpState, useRequestLcpAnalyze, type LcpPage } from '../lib/use-lcp-state';
import './lcp-status.scss';

function formatTimeSince( ts: number | null | undefined ): string {
	if ( ! ts ) {
		return '';
	}
	const seconds = Math.max( 0, Math.floor( Date.now() / 1000 - ts ) );
	if ( seconds < 60 ) {
		return __( 'just now', 'jetpack-boost' );
	}
	const minutes = Math.floor( seconds / 60 );
	if ( minutes < 60 ) {
		return sprintf(
			/* translators: %d minutes ago. */
			_n( '%d minute ago', '%d minutes ago', minutes, 'jetpack-boost' ),
			minutes
		);
	}
	const hours = Math.floor( minutes / 60 );
	if ( hours < 24 ) {
		return sprintf(
			/* translators: %d hours ago. */
			_n( '%d hour ago', '%d hours ago', hours, 'jetpack-boost' ),
			hours
		);
	}
	const days = Math.floor( hours / 24 );
	return sprintf(
		/* translators: %d days ago. */
		_n( '%d day ago', '%d days ago', days, 'jetpack-boost' ),
		days
	);
}

function countErrorPages( pages: LcpPage[] | undefined ): number {
	return ( pages ?? [] ).filter( p => ( p.errors?.length ?? 0 ) > 0 ).length;
}

/**
 * Status panel for the LCP module card. Mirrors the legacy LCP
 * status block: a one-line summary of the current state, an
 * **Optimize** action that fires the `lcp_state.request-analyze`
 * action, and a soft error notice when one or more cornerstone
 * pages failed to optimize.
 *
 * Polling is handled by `useLcpState` — the parent doesn't need to
 * coordinate refreshes.
 *
 * @return The LCP status element.
 */
export default function LcpStatus(): JSX.Element {
	const stateQuery = useLcpState();
	const analyze = useRequestLcpAnalyze();

	const state = stateQuery.data;
	const isPending = state?.status === 'pending';
	const isAnalyzed = state?.status === 'analyzed';
	const isError = state?.status === 'error';
	const updatedLabel = formatTimeSince( state?.updated );
	const errorPages = countErrorPages( state?.pages );

	const onOptimize = () => analyze.mutate( undefined as never );

	return (
		<Stack direction="column" gap="md" className="jetpack-boost-lcp-status">
			{ isPending && (
				<Text variant="body-md">
					{ __( 'Analyzing your cornerstone pages — this can take a minute.', 'jetpack-boost' ) }
				</Text>
			) }

			{ isAnalyzed && updatedLabel && (
				<Text variant="body-md">
					{ sprintf(
						/* translators: %s is the time since the last analysis. */
						__( 'Last optimized %s.', 'jetpack-boost' ),
						updatedLabel
					) }
				</Text>
			) }

			{ isAnalyzed && ! updatedLabel && (
				<Text variant="body-md">{ __( 'Optimization complete.', 'jetpack-boost' ) }</Text>
			) }

			{ isError && (
				<Notice.Root intent="error">
					<Notice.Title>{ __( 'LCP optimization failed', 'jetpack-boost' ) }</Notice.Title>
					<Notice.Description>
						{ __(
							'Try optimizing again, or open the LCP details for the failing pages.',
							'jetpack-boost'
						) }
					</Notice.Description>
				</Notice.Root>
			) }

			{ errorPages > 0 && (
				<Notice.Root intent="warning">
					<Notice.Description>
						{ sprintf(
							/* translators: %d is the number of pages that hit errors. */
							_n(
								'%d page failed to optimize.',
								'%d pages failed to optimize.',
								errorPages,
								'jetpack-boost'
							),
							errorPages
						) }
					</Notice.Description>
				</Notice.Root>
			) }

			<div className="jetpack-boost-lcp-status__actions">
				<Button
					variant="secondary"
					isBusy={ analyze.isPending || isPending }
					disabled={ analyze.isPending || isPending }
					onClick={ onOptimize }
				>
					{ __( 'Optimize', 'jetpack-boost' ) }
				</Button>
			</div>
		</Stack>
	);
}
