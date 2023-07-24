import { getJetpackData } from '@automattic/jetpack-shared-extension-utils';
import apiFetch from '@wordpress/api-fetch';
import { useCallback, useMemo, useState } from 'react';

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
	const [ dismissedNotices, setDismissedNotices ] = useState( () => {
		return (
			getJetpackData()?.social?.dismissedNotices ??
			window?.jetpackSocialInitialState?.jetpackSettings?.dismissedNotices ??
			[]
		);
	} );

	const dismissNotice = useCallback( notice => {
		// Optimistically update the dismissed notices.
		setDismissedNotices( notices => [ ...notices, notice ] );

		apiFetch( {
			path: `jetpack/v4/social/dismiss-notice`,
			method: 'POST',
			data: { notice },
		} );
	}, [] );

	return useMemo(
		() => ( { dismissedNotices, dismissNotice } ),
		[ dismissedNotices, dismissNotice ]
	);
}
