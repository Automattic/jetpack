import { formatNumber } from '@automattic/number-formatters';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';
import { Button } from '@wordpress/ui';
import { recordTracksEvent } from '../lib/tracks';
import SelfOnlyNudge from './self-only-nudge';
import type { SubscribersExportQuery } from '../data/types';
import type { JetpackBlogId } from '../lib/site';
import type { JSX } from 'react';

type Props = {
	blogId: JetpackBlogId | null;
	exportQuery: SubscribersExportQuery;
	onAddSubscribers: () => void;
	showSelfOnlyNudge: boolean;
	onDismissSelfOnlyNudge: () => void;
	matchingCount: number;
	narrowed: boolean;
	isBulkRemoveRunning: boolean;
	onRemoveAll: () => void;
	onRemoveMatching: () => void;
};

/**
 * Build the WP.com CSV export URL for a blog, carrying the table's filters, search and sort so the
 * file holds the rows the table shows, in the same order.
 *
 * @param blogId          - WP.com blog id (coerced to a positive integer before injection).
 * @param query           - The table's current filters, search and sort.
 * @param query.filters   - Filter values, combined with AND.
 * @param query.search    - Search term, or an empty string.
 * @param query.sort      - Sort field.
 * @param query.sortOrder - Sort direction.
 * @return Absolute URL, or null when the id can't be coerced to a positive integer.
 */
export function getCsvDownloadUrl(
	blogId: JetpackBlogId,
	{ filters, search, sort, sortOrder }: SubscribersExportQuery
): string | null {
	const safeId = Math.trunc( Number( blogId ) );
	if ( ! Number.isFinite( safeId ) || safeId <= 0 ) {
		return null;
	}
	const params = new URLSearchParams( {
		page: 'subscribers',
		blog: String( safeId ),
		blog_subscribers: 'csv',
		type: 'all',
		sort,
		sort_order: sortOrder,
	} );
	// WP.com reads `filters[]` as an array, the same shape the subscriber list endpoint takes.
	filters.forEach( filter => params.append( 'filters[]', filter ) );
	if ( search ) {
		params.set( 'search', search );
	}
	return `https://dashboard.wordpress.com/wp-admin/index.php?${ params.toString() }`;
}

/**
 * Page-header action row — primary "Add subscribers" CTA and a More menu (Download CSV, and the
 * bulk removals: everyone, or everyone matching the table's search and filters).
 * Page already wraps actions in a Stack with `gap="sm"`, so we don't add an extra wrapper here.
 *
 * @param props                        - Component props.
 * @param props.blogId                 - WP.com blog id, used to build the CSV download URL.
 * @param props.exportQuery            - The table's filters, search and sort, reported by the table, so the CSV matches it.
 * @param props.onAddSubscribers       - Callback to open the Add Subscribers modal (owned by the parent so the empty state can trigger it too).
 * @param props.showSelfOnlyNudge      - Whether to point the self-only nudge at the CTA.
 * @param props.onDismissSelfOnlyNudge - Called when the viewer closes the nudge; the parent owns
 *                                     the state because this row unmounts on a tab hop.
 * @param props.matchingCount          - Subscribers matching the table's search and filters.
 * @param props.narrowed               - Whether a search or filter is on.
 * @param props.isBulkRemoveRunning    - True while a bulk removal runs; the remove items are disabled.
 * @param props.onRemoveAll            - Open the confirm dialog for removing everyone.
 * @param props.onRemoveMatching       - Open the confirm dialog for removing the matches.
 * @return Action row.
 */
export default function HeaderActions( {
	blogId,
	exportQuery,
	onAddSubscribers,
	showSelfOnlyNudge,
	onDismissSelfOnlyNudge,
	matchingCount,
	narrowed,
	isBulkRemoveRunning,
	onRemoveAll,
	onRemoveMatching,
}: Props ): JSX.Element {
	const [ ctaAnchor, setCtaAnchor ] = useState< HTMLButtonElement | null >( null );

	return (
		<>
			<Button size="compact" ref={ setCtaAnchor } onClick={ onAddSubscribers }>
				{ __( 'Add subscribers', 'jetpack-newsletter' ) }
			</Button>
			{ showSelfOnlyNudge && (
				<SelfOnlyNudge anchor={ ctaAnchor } onDismiss={ onDismissSelfOnlyNudge } />
			) }
			<DropdownMenu icon={ moreVertical } label={ __( 'More options', 'jetpack-newsletter' ) }>
				{ ( { onClose } ) => (
					<MoreMenuItems
						blogId={ blogId }
						exportQuery={ exportQuery }
						matchingCount={ matchingCount }
						narrowed={ narrowed }
						isBulkRemoveRunning={ isBulkRemoveRunning }
						onRemoveAll={ onRemoveAll }
						onRemoveMatching={ onRemoveMatching }
						onClose={ onClose }
					/>
				) }
			</DropdownMenu>
		</>
	);
}

type MoreMenuItemsProps = Pick<
	Props,
	| 'blogId'
	| 'exportQuery'
	| 'matchingCount'
	| 'narrowed'
	| 'isBulkRemoveRunning'
	| 'onRemoveAll'
	| 'onRemoveMatching'
> & {
	onClose: () => void;
};

/**
 * The More menu's items: the CSV download, then the bulk removals.
 *
 * @param props                     - Component props.
 * @param props.blogId              - WP.com blog id, used to build the CSV download URL.
 * @param props.exportQuery         - The table's filters, search and sort.
 * @param props.matchingCount       - Subscribers matching the table's search and filters.
 * @param props.narrowed            - Whether a search or filter is on.
 * @param props.isBulkRemoveRunning - True while a bulk removal runs; the remove items are disabled.
 * @param props.onRemoveAll         - Open the confirm dialog for removing everyone.
 * @param props.onRemoveMatching    - Open the confirm dialog for removing the matches.
 * @param props.onClose             - Close the menu.
 * @return Menu groups.
 */
function MoreMenuItems( {
	blogId,
	exportQuery,
	matchingCount,
	narrowed,
	isBulkRemoveRunning,
	onRemoveAll,
	onRemoveMatching,
	onClose,
}: MoreMenuItemsProps ): JSX.Element {
	const handleDownload = useCallback( () => {
		const url = blogId ? getCsvDownloadUrl( blogId, exportQuery ) : null;
		if ( url ) {
			recordTracksEvent( 'jetpack_subscribers_export_downloaded', {
				filters: exportQuery.filters.join( ',' ) || 'all',
				has_search: exportQuery.search ? 1 : 0,
			} );
			window.open( url, '_blank', 'noopener,noreferrer' );
		}
		onClose();
	}, [ blogId, exportQuery, onClose ] );

	const handleRemoveMatching = useCallback( () => {
		onRemoveMatching();
		onClose();
	}, [ onRemoveMatching, onClose ] );

	const handleRemoveAll = useCallback( () => {
		onRemoveAll();
		onClose();
	}, [ onRemoveAll, onClose ] );

	return (
		<>
			<MenuGroup>
				<MenuItem disabled={ ! blogId } onClick={ handleDownload }>
					{ __( 'Download as CSV', 'jetpack-newsletter' ) }
				</MenuItem>
			</MenuGroup>
			<MenuGroup>
				{ narrowed && matchingCount > 0 ? (
					<MenuItem isDestructive disabled={ isBulkRemoveRunning } onClick={ handleRemoveMatching }>
						{ sprintf(
							// translators: %s: number of subscribers.
							_n(
								'Remove %s matching subscriber',
								'Remove %s matching subscribers',
								matchingCount,
								'jetpack-newsletter'
							),
							formatNumber( matchingCount )
						) }
					</MenuItem>
				) : null }
				<MenuItem isDestructive disabled={ isBulkRemoveRunning } onClick={ handleRemoveAll }>
					{ __( 'Remove all subscribers', 'jetpack-newsletter' ) }
				</MenuItem>
			</MenuGroup>
		</>
	);
}
