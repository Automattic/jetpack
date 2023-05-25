import { getJetpackData } from '@automattic/jetpack-shared-extension-utils';
import apiFetch from '@wordpress/api-fetch';

/**
 * @typedef {object} DismissNoticeHook
 * @property {Array} dismissedNotices - Array of names of dismissed notices.
 * @property {Function} dismissNotice - Callback used to dismiss a notice.
 */

/**
 * Hook to handle retrieving dismissed notices and dismissing a notice.
 *
 * @returns {DismissNoticeHook} - An object with the dismissed notice hook properties set.
 */
export default function useDismissNotice() {
	const dismissedNotices =
		getJetpackData()?.social?.dismissedNotices ??
		window?.jetpackSocialInitialState?.jetpackSettings?.dismissedNotices ??
		[];

	const handleDismiss = notice => {
		apiFetch( {
			path: `jetpack/v4/social/dismiss-notice`,
			method: 'POST',
			data: { notice },
		} );
	};

	return {
		dismissedNotices,
		dismissNotice: notice => handleDismiss( notice ),
	};
}
