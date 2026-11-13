import { formatNumber } from '@automattic/number-formatters';
import { speak } from '@wordpress/a11y';
import { useCallback } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import type { JSX, MouseEvent } from 'react';

type Props = {
	pageCount: number;
	selectedCount: number;
	matchingCount: number;
	totalPages: number;
	narrowed: boolean;
	isAllSelected: boolean;
	disabled: boolean;
	canSelectAll?: boolean;
	onSelectAll: () => void;
	onRemovePage: () => void;
	onRemoveAll: () => void;
	onClear: () => void;
};

/**
 * The banner above the table once every row on the page is selected. When there are more pages,
 * it offers to select every matching subscriber, which the background job then removes.
 *
 * @param props               - Component props.
 * @param props.pageCount     - Rows on this page.
 * @param props.selectedCount - Rows selected on this page.
 * @param props.matchingCount - Subscribers matching the search and filters, across all pages.
 * @param props.totalPages    - Pages in the list.
 * @param props.narrowed      - Whether a search or filter is on.
 * @param props.isAllSelected - Whether "Select all N" was clicked.
 * @param props.disabled      - True while a removal runs.
 * @param props.canSelectAll  - Whether to offer "Select all N". Selecting across pages starts the
 *                            background job, so this is off until WP.com turns removal on for the
 *                            site; the banner then offers only this page's rows.
 * @param props.onSelectAll   - Select every matching subscriber.
 * @param props.onRemovePage  - Remove the rows on this page, the existing way.
 * @param props.onRemoveAll   - Open the bulk confirm for every matching subscriber.
 * @param props.onClear       - Clear the selection.
 * @return Banner, or null when the page is not fully selected.
 */
export default function SelectionBanner( {
	pageCount,
	selectedCount,
	matchingCount,
	totalPages,
	narrowed,
	isAllSelected,
	disabled,
	canSelectAll = true,
	onSelectAll,
	onRemovePage,
	onRemoveAll,
	onClear,
}: Props ): JSX.Element | null {
	// Clearing removes this banner, so focus moves to the table's select-all checkbox.
	const handleClear = useCallback(
		( event: MouseEvent< HTMLElement > ) => {
			const checkbox = event.currentTarget
				.closest( '.dataviews-wrapper' )
				?.querySelector< HTMLElement >(
					'thead .dataviews-view-table__checkbox-column [role="checkbox"]'
				);
			onClear();
			checkbox?.focus();
		},
		[ onClear ]
	);

	// The banner's text changes in place, so screen readers hear nothing without this.
	const handleSelectAll = useCallback( () => {
		onSelectAll();
		const count = formatNumber( matchingCount );
		const pages = formatNumber( totalPages );
		speak(
			narrowed
				? sprintf(
						// translators: %1$s: number of subscribers. %2$s: number of pages.
						_n(
							'All %1$s matching subscriber is selected, across all %2$s pages.',
							'All %1$s matching subscribers are selected, across all %2$s pages.',
							matchingCount,
							'jetpack-newsletter'
						),
						count,
						pages
					)
				: sprintf(
						// translators: %1$s: number of subscribers. %2$s: number of pages.
						_n(
							'All %1$s subscriber is selected, across all %2$s pages.',
							'All %1$s subscribers are selected, across all %2$s pages.',
							matchingCount,
							'jetpack-newsletter'
						),
						count,
						pages
					)
		);
	}, [ onSelectAll, narrowed, matchingCount, totalPages ] );

	if ( pageCount === 0 || selectedCount < pageCount ) {
		return null;
	}

	const n = formatNumber( matchingCount );
	const k = formatNumber( pageCount );

	if ( isAllSelected && canSelectAll ) {
		return (
			<Notice.Root intent="neutral" className="jetpack-newsletter__selection-banner">
				<Notice.Description>
					{ narrowed
						? sprintf(
								// translators: %1$s: number of subscribers. %2$s: number of pages.
								_n(
									'All %1$s matching subscriber is selected, across all %2$s pages.',
									'All %1$s matching subscribers are selected, across all %2$s pages.',
									matchingCount,
									'jetpack-newsletter'
								),
								n,
								formatNumber( totalPages )
							)
						: sprintf(
								// translators: %1$s: number of subscribers. %2$s: number of pages.
								_n(
									'All %1$s subscriber is selected, across all %2$s pages.',
									'All %1$s subscribers are selected, across all %2$s pages.',
									matchingCount,
									'jetpack-newsletter'
								),
								n,
								formatNumber( totalPages )
							) }
				</Notice.Description>
				<Notice.Actions>
					<Notice.ActionButton onClick={ onRemoveAll } disabled={ disabled }>
						{ sprintf(
							// translators: %s: number of subscribers.
							_n(
								'Remove %s subscriber',
								'Remove %s subscribers',
								matchingCount,
								'jetpack-newsletter'
							),
							n
						) }
					</Notice.ActionButton>
					<Notice.ActionButton variant="minimal" onClick={ handleClear }>
						{ __( 'Clear selection', 'jetpack-newsletter' ) }
					</Notice.ActionButton>
				</Notice.Actions>
			</Notice.Root>
		);
	}

	// Everyone fits on this page, so there is nothing more to select.
	if ( matchingCount <= pageCount ) {
		return (
			<Notice.Root intent="neutral" className="jetpack-newsletter__selection-banner">
				<Notice.Description>
					{ sprintf(
						// translators: %s: number of subscribers.
						_n(
							'%s subscriber is selected.',
							'All %s subscribers are selected.',
							pageCount,
							'jetpack-newsletter'
						),
						k
					) }
				</Notice.Description>
				<Notice.Actions>
					<Notice.ActionButton onClick={ onRemovePage } disabled={ disabled }>
						{ sprintf(
							// translators: %s: number of subscribers.
							_n(
								'Remove %s subscriber',
								'Remove %s subscribers',
								pageCount,
								'jetpack-newsletter'
							),
							k
						) }
					</Notice.ActionButton>
					<Notice.ActionButton variant="minimal" onClick={ handleClear }>
						{ __( 'Clear selection', 'jetpack-newsletter' ) }
					</Notice.ActionButton>
				</Notice.Actions>
			</Notice.Root>
		);
	}

	return (
		<Notice.Root intent="neutral" className="jetpack-newsletter__selection-banner">
			<Notice.Description>
				{ sprintf(
					// translators: %s: number of subscribers on this page.
					_n(
						'%s subscriber on this page is selected.',
						'All %s subscribers on this page are selected.',
						pageCount,
						'jetpack-newsletter'
					),
					k
				) }
			</Notice.Description>
			<Notice.Actions>
				{ canSelectAll ? (
					<Notice.ActionButton variant="minimal" onClick={ handleSelectAll } disabled={ disabled }>
						{ narrowed
							? sprintf(
									// translators: %s: number of subscribers.
									_n(
										'Select %s matching subscriber',
										'Select all %s matching subscribers',
										matchingCount,
										'jetpack-newsletter'
									),
									n
								)
							: sprintf(
									// translators: %s: number of subscribers.
									_n(
										'Select %s subscriber',
										'Select all %s subscribers',
										matchingCount,
										'jetpack-newsletter'
									),
									n
								) }
					</Notice.ActionButton>
				) : null }
				<Notice.ActionButton onClick={ onRemovePage } disabled={ disabled }>
					{ sprintf(
						// translators: %s: number of subscribers on this page.
						_n( 'Remove this %s', 'Remove these %s', pageCount, 'jetpack-newsletter' ),
						k
					) }
				</Notice.ActionButton>
			</Notice.Actions>
		</Notice.Root>
	);
}
