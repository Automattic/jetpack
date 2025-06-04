import { wpcomTrackEvent } from '../../../common/tracks';

declare const wpcomPostListData: {
	postType: string;
};

/**
 * Tracks clicks on the post list table.
 */
function wpcomPostListTracks() {
	document.getElementById( 'the-list' )?.addEventListener( 'click', function ( event ) {
		const target = event.target as HTMLElement;
		if ( target.tagName === 'A' || target.matches( '.button-link.editinline' ) ) {
			wpcomTrackQuickLinksClicks( target );
			return;
		}

		if ( target.tagName === 'SPAN' ) {
			wpcomTrackStatsIconClicks( target );
		}
	} );
}

/**
 * Tracks clicks on the quick links in the post list table.
 *
 * @param target - The element that was clicked.
 */
function wpcomTrackQuickLinksClicks( target: HTMLElement ) {
	const isPartOfRowActions = !! target.closest( '.row-actions' );
	if ( ! isPartOfRowActions ) {
		return;
	}

	const span = target.parentElement;
	if ( ! span ) {
		return;
	}

	let linkName = span.className;

	if ( span.matches( '.inline.hide-if-no-js' ) ) {
		linkName = 'quick-edit';
	}

	wpcomTrackEvent( 'wpcom_post_list_quick_link_clicked', {
		link_name: linkName,
		post_type: wpcomPostListData.postType,
	} );
}

/**
 * Tracks clicks on the stats icon in the post list table.
 *
 * @param target - The element that was clicked.
 */
function wpcomTrackStatsIconClicks( target: HTMLElement ) {
	const parentElement = target.parentElement?.parentElement;

	if ( ! parentElement?.matches( '.stats.column-stats' ) ) {
		return;
	}

	wpcomTrackEvent( 'wpcom_post_list_stats_icon_clicked', {
		post_type: wpcomPostListData.postType,
	} );
}

document.addEventListener( 'DOMContentLoaded', wpcomPostListTracks );
