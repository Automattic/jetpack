import { DropdownMenu } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
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
 * Page-header action row — primary "Add subscribers" CTA and a More menu (Download CSV).
 * Page already wraps actions in a Stack with `gap="sm"`, so we don't add an extra wrapper here.
 *
 * @param props                        - Component props.
 * @param props.blogId                 - WP.com blog id, used to build the CSV download URL.
 * @param props.exportQuery            - The table's filters, search and sort, reported by the table, so the CSV matches it.
 * @param props.onAddSubscribers       - Callback to open the Add Subscribers modal (owned by the parent so the empty state can trigger it too).
 * @param props.showSelfOnlyNudge      - Whether to point the self-only nudge at the CTA.
 * @param props.onDismissSelfOnlyNudge - Called when the viewer closes the nudge; the parent owns
 *                                     the state because this row unmounts on a tab hop.
 * @return Action row.
 */
export default function HeaderActions( {
	blogId,
	exportQuery,
	onAddSubscribers,
	showSelfOnlyNudge,
	onDismissSelfOnlyNudge,
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
			<DropdownMenu
				icon={ moreVertical }
				label={ __( 'More options', 'jetpack-newsletter' ) }
				controls={ [
					{
						title: __( 'Download as CSV', 'jetpack-newsletter' ),
						onClick: () => {
							const url = blogId ? getCsvDownloadUrl( blogId, exportQuery ) : null;
							if ( url ) {
								recordTracksEvent( 'jetpack_subscribers_export_downloaded', {
									filters: exportQuery.filters.join( ',' ) || 'all',
									has_search: exportQuery.search ? 1 : 0,
								} );
								window.open( url, '_blank', 'noopener,noreferrer' );
							}
						},
						isDisabled: ! blogId,
					},
				] }
			/>
		</>
	);
}
