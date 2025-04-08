/* global wp, wpcomSidebarNoticeData */
import { wpcomTrackEvent } from '../../common/tracks';

import './wpcom-sidebar-notice.scss';

const wpcomSidebarNoticeRecordEvent = ( event, wpcomSidebarNoticeData ) => {
	if ( ! event ) {
		return;
	}
	wpcomTrackEvent(
		event.name,
		event.props,
		wpcomSidebarNoticeData.user.ID,
		wpcomSidebarNoticeData.user.username
	);
};

const wpcomShowSidebarNotice = () => {
	const sidebarNotice = document.querySelector( '#toplevel_page_site-notices' );
	if ( ! sidebarNotice || ! wpcomSidebarNoticeData ) {
		return;
	}

	// Record impression event in Tracks.
	wpcomSidebarNoticeRecordEvent( wpcomSidebarNoticeData.tracks?.display, wpcomSidebarNoticeData );

	sidebarNotice.addEventListener( 'click', event => {
		if (
			event.target.classList.contains( 'upsell_banner__dismiss' ) ||
			event.target.closest( '.upsell_banner__dismiss' )
		) {
			// Handle dismiss.
			event.preventDefault();
			wp.ajax.post( 'wpcom_dismiss_sidebar_notice', {
				id: sidebarNotice.dataset.id,
				feature_class: sidebarNotice.dataset.featureClass,
				_ajax_nonce: wpcomSidebarNoticeData.dismissNonce,
			} );
			sidebarNotice.remove();

			// Record dismiss event in Tracks.
			wpcomSidebarNoticeRecordEvent(
				wpcomSidebarNoticeData.tracks?.dismiss,
				wpcomSidebarNoticeData
			);
		} else {
			// Record click event in Tracks.
			wpcomSidebarNoticeRecordEvent( wpcomSidebarNoticeData.tracks?.click, wpcomSidebarNoticeData );
		}
	} );
};

document.addEventListener( 'DOMContentLoaded', wpcomShowSidebarNotice );
