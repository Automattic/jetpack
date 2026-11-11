import { formatNumber } from '@automattic/number-formatters';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { AlertDialog, Button, InputControl, Notice, Stack, Text } from '@wordpress/ui';
import { useBulkRemoveCounts, useStartBulkRemoveMutation } from '../../data/use-bulk-remove';
import {
	describeNarrowing,
	describeScope,
	isNarrowed,
	normalizeTypedCount,
} from '../../lib/bulk-remove-scope';
import { recordTracksEvent } from '../../lib/tracks';
import { getCsvDownloadUrl } from '../header-actions';
import type { SubscribersExportQuery } from '../../data/types';
import type { BulkRemoveError, BulkRemoveScope } from '../../data/use-bulk-remove';
import type { JetpackBlogId } from '../../lib/site';
import type { JSX } from 'react';

type Props = {
	scope: BulkRemoveScope | null;
	query: SubscribersExportQuery;
	examples: string[];
	blogId: JetpackBlogId | null;
	onChangeScope: ( scope: BulkRemoveScope ) => void;
	onClose: () => void;
};

/**
 * Confirm dialog for removing every subscriber, or every one matching the table's search and
 * filters, through the WP.com background job. It counts the subscribers fresh, says which
 * subscribers go and how many paid subscriptions get cancelled, offers the CSV first, and asks for
 * the count to be typed.
 *
 * @param props               - Component props.
 * @param props.scope         - `all`, `matching`, or null when closed.
 * @param props.query         - The table's filters, search and sort.
 * @param props.examples      - Up to three email addresses from the table, for "For example".
 * @param props.blogId        - WP.com blog id, for the CSV link.
 * @param props.onChangeScope - Switch between removing everyone and removing the matches.
 * @param props.onClose       - Close the dialog.
 * @return The dialog, or null when closed.
 */
export default function BulkRemoveModal( {
	scope,
	query,
	examples,
	blogId,
	onChangeScope,
	onClose,
}: Props ): JSX.Element | null {
	const isOpen = scope !== null;
	const narrowed = isNarrowed( query.filters, query.search );
	const isAll = scope === 'all' || ! narrowed;

	const everyone = useBulkRemoveCounts( { filters: [ 'all' ], search: '', enabled: isOpen } );
	const matching = useBulkRemoveCounts( {
		filters: query.filters,
		search: query.search,
		enabled: isOpen && narrowed,
	} );
	const counts = isAll ? everyone : matching;
	const total = counts.data?.total ?? 0;
	const paid = counts.data?.paid ?? 0;
	const listTotal = everyone.data?.total ?? 0;
	const matchingTotal = matching.data?.total ?? 0;

	const [ typed, setTyped ] = useState( '' );
	const [ csvDownloaded, setCsvDownloaded ] = useState( false );
	const start = useStartBulkRemoveMutation();

	useEffect( () => {
		setTyped( '' );
		setCsvDownloaded( false );
		if ( isOpen ) {
			recordTracksEvent( 'jetpack_subscribers_bulk_remove_modal_showed', {
				scope: isAll ? 'all' : 'matching',
				narrowed: narrowed ? 1 : 0,
			} );
		}
		// Record once per open and per scope switch, not on every count update.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ isOpen, isAll ] );

	const csvQuery: SubscribersExportQuery = isAll ? { ...query, filters: [], search: '' } : query;
	const csvUrl = blogId ? getCsvDownloadUrl( blogId, csvQuery ) : null;

	const handleDownload = useCallback( () => {
		if ( ! csvUrl ) {
			return;
		}
		recordTracksEvent( 'jetpack_subscribers_export_downloaded', {
			filters: csvQuery.filters.join( ',' ) || 'all',
			has_search: csvQuery.search ? 1 : 0,
			source: 'bulk_remove_modal',
		} );
		window.open( csvUrl, '_blank', 'noopener,noreferrer' );
		setCsvDownloaded( true );
	}, [ csvUrl, csvQuery.filters, csvQuery.search ] );

	const switchToMatching = useCallback( () => onChangeScope( 'matching' ), [ onChangeScope ] );

	const handleOpenChange = useCallback(
		( nextOpen: boolean ) => {
			if ( ! nextOpen ) {
				recordTracksEvent( 'jetpack_subscribers_bulk_remove_modal_dismissed', {
					scope: isAll ? 'all' : 'matching',
				} );
				onClose();
			}
		},
		[ isAll, onClose ]
	);

	const handleConfirm = useCallback( async () => {
		if ( ! counts.data ) {
			return { close: false };
		}
		if ( total < 1 ) {
			return {
				close: false,
				error: __( 'There are no subscribers to remove.', 'jetpack-newsletter' ),
			};
		}
		if ( normalizeTypedCount( typed ) !== String( total ) ) {
			return {
				close: false,
				error: sprintf(
					// translators: %s: number of subscribers, e.g. "15,000".
					__( 'Type %s to confirm.', 'jetpack-newsletter' ),
					formatNumber( total )
				),
			};
		}
		recordTracksEvent( 'jetpack_subscribers_bulk_remove_confirmed', {
			scope: isAll ? 'all' : 'matching',
			total,
			paid,
			csv_downloaded: csvDownloaded ? 1 : 0,
		} );
		try {
			await start.mutateAsync( {
				scope: isAll ? 'all' : 'matching',
				filters: query.filters,
				search: query.search,
				expectedCount: total,
			} );
			onClose();
			return { close: true };
		} catch ( err ) {
			const error = err as BulkRemoveError;
			if ( error?.code === 'bulk_remove_in_progress' ) {
				// The running job is now in the status cache, so the progress notice shows it.
				onClose();
				return { close: true };
			}
			if ( error?.code === 'bulk_remove_count_changed' ) {
				setTyped( '' );
				await counts.refetch();
				return {
					close: false,
					error: sprintf(
						// translators: %s: the new number of subscribers.
						__(
							'Your list changed while this was open. It now has %s subscribers to remove. Check the number and type it again.',
							'jetpack-newsletter'
						),
						formatNumber( error.data?.count ?? 0 )
					),
				};
			}
			return {
				close: false,
				error:
					error?.message || __( 'Could not start removing subscribers.', 'jetpack-newsletter' ),
			};
		}
	}, [ counts, total, paid, typed, isAll, csvDownloaded, start, query, onClose ] );

	if ( ! isOpen ) {
		return null;
	}

	const title = isAll
		? sprintf(
				// translators: %s: number of subscribers.
				_n(
					'Remove all %s subscriber?',
					'Remove all %s subscribers?',
					total,
					'jetpack-newsletter'
				),
				formatNumber( total )
			)
		: sprintf(
				// translators: %s: number of subscribers.
				_n(
					'Remove %s matching subscriber?',
					'Remove %s matching subscribers?',
					total,
					'jetpack-newsletter'
				),
				formatNumber( total )
			);

	const scopeLines = isAll ? [] : describeScope( query.filters, query.search );
	const shownExamples = examples.slice( 0, 3 );
	const more = Math.max( 0, total - shownExamples.length );

	const consequence = paid
		? sprintf(
				// translators: %s: number of paid subscriptions.
				_n(
					'They’ll be unsubscribed from your site, and %s paid subscription will be cancelled.',
					'They’ll be unsubscribed from your site, and %s paid subscriptions will be cancelled.',
					paid,
					'jetpack-newsletter'
				),
				formatNumber( paid )
			)
		: __( 'They’ll be unsubscribed from your site.', 'jetpack-newsletter' );

	const remaining = Math.max( 0, listTotal - total );

	return (
		<AlertDialog.Root open onOpenChange={ handleOpenChange } onConfirm={ handleConfirm }>
			<AlertDialog.Popup
				intent="irreversible"
				title={ counts.isLoading ? __( 'Remove subscribers?', 'jetpack-newsletter' ) : title }
				confirmButtonText={ sprintf(
					// translators: %s: number of subscribers.
					_n( 'Remove %s subscriber', 'Remove %s subscribers', total, 'jetpack-newsletter' ),
					formatNumber( total )
				) }
				cancelButtonText={ __( 'Cancel', 'jetpack-newsletter' ) }
			>
				{ counts.isLoading ? (
					<Text variant="body-md">
						{ __( 'Counting your subscribers…', 'jetpack-newsletter' ) }
					</Text>
				) : null }
				{ counts.isError ? (
					<Notice.Root intent="error">
						<Notice.Description>
							{ __(
								'Could not count your subscribers. Close this and try again.',
								'jetpack-newsletter'
							) }
						</Notice.Description>
					</Notice.Root>
				) : null }
				{ counts.data ? (
					<Stack direction="column" gap="md">
						{ isAll && narrowed && matching.data ? (
							<Notice.Root intent="warning">
								<Notice.Description>
									{ sprintf(
										// translators: %1$s: number of matching subscribers. %2$s: "search", "filter" or "search and filter".
										__(
											'This removes everyone on your list, not only the %1$s that match your %2$s.',
											'jetpack-newsletter'
										),
										formatNumber( matchingTotal ),
										describeNarrowing( query.filters, query.search )
									) }{ ' ' }
									<Button variant="minimal" size="compact" onClick={ switchToMatching }>
										{ sprintf(
											// translators: %s: number of matching subscribers.
											__( 'Remove only the %s matching subscribers instead', 'jetpack-newsletter' ),
											formatNumber( matchingTotal )
										) }
									</Button>
								</Notice.Description>
							</Notice.Root>
						) : null }
						{ scopeLines.length ? (
							<div className="jetpack-newsletter__bulk-remove-scope">
								<Text variant="body-md">
									<strong>{ __( 'Everyone who matches:', 'jetpack-newsletter' ) }</strong>
								</Text>
								<ul>
									{ scopeLines.map( line => (
										<li key={ line }>{ line }</li>
									) ) }
								</ul>
								{ shownExamples.length ? (
									<Text variant="body-sm">
										{ more > 0
											? sprintf(
													// translators: %1$s: comma-separated email addresses. %2$s: number of other subscribers.
													__( 'For example %1$s, and %2$s more.', 'jetpack-newsletter' ),
													shownExamples.join( ', ' ),
													formatNumber( more )
												)
											: sprintf(
													// translators: %s: comma-separated email addresses.
													__( 'For example %s.', 'jetpack-newsletter' ),
													shownExamples.join( ', ' )
												) }
									</Text>
								) : null }
							</div>
						) : null }
						<Text variant="body-md">
							{ consequence }{ ' ' }
							{ ! isAll
								? sprintf(
										// translators: %s: number of subscribers who are not removed.
										_n(
											'The other %s stays on your list.',
											'The other %s stay on your list.',
											remaining,
											'jetpack-newsletter'
										),
										formatNumber( remaining )
									) + ' '
								: '' }
							{ __(
								'This can’t be undone, and we can’t bring them back for you.',
								'jetpack-newsletter'
							) }
						</Text>
						<Text variant="body-md">
							{ csvDownloaded ? (
								__(
									'CSV downloaded. Keep it if you might want this list later.',
									'jetpack-newsletter'
								)
							) : (
								<>
									{ __( 'Before you continue,', 'jetpack-newsletter' ) }{ ' ' }
									<Button
										variant="minimal"
										size="compact"
										onClick={ handleDownload }
										disabled={ ! csvUrl }
									>
										{ isAll
											? __( 'download all your subscribers as a CSV', 'jetpack-newsletter' )
											: sprintf(
													// translators: %s: number of subscribers.
													__( 'download these %s subscribers as a CSV', 'jetpack-newsletter' ),
													formatNumber( total )
												) }
									</Button>{ ' ' }
									{ __( 'so you have a copy.', 'jetpack-newsletter' ) }
								</>
							) }
						</Text>
						<InputControl
							label={ sprintf(
								// translators: %s: number of subscribers, e.g. "15000".
								__( 'Type %s to confirm', 'jetpack-newsletter' ),
								String( total )
							) }
							value={ typed }
							onValueChange={ setTyped }
							autoComplete="off"
							inputMode="numeric"
						/>
					</Stack>
				) : null }
			</AlertDialog.Popup>
		</AlertDialog.Root>
	);
}
