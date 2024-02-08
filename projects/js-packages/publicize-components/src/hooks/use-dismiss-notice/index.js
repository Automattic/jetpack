import { getJetpackData } from '@automattic/jetpack-shared-extension-utils';
import apiFetch from '@wordpress/api-fetch';
import { useCallback, useMemo, useState } from '@wordpress/element';

/**
 * @typedef {object} NoticeTypes
 * @property {string} instagram - The name of the Instagram notice.
 * @property {string} advancedUpgradeEditor - The name of the advanced upgrade nudge in the editor.
 * @property {string} advancedUpgradeAdmin - The name of the advanced upgrade nudge in the admin page.
 * @property {string} autoConversion - The name of the auto conversion notice.
 */

const NOTICES = {
	instagram: 'instagram',
	advancedUpgradeEditor: 'advanced-upgrade-nudge-editor',
	advancedUpgradeAdmin: 'advanced-upgrade-nudge-admin',
	autoConversion: 'auto-conversion-editor-notice',
};

const calculateReappearanceTime = seconds => {
	if ( seconds === -1 ) {
		return 0;
	}
	return new Date( Date.now() + seconds * 1000 ).getTime();
};

/**
 * @typedef {object} DismissNoticeHook
 * @property {Array} dismissedNotices - Array of names of dismissed notices.
 * @property {Function} dismissNotice - Callback used to dismiss a notice.
 * @property {Function} shouldShowNotice - Callback used to check if a notice should be shown.
 * @property {NoticeTypes} NOTICES - Object containing the names of the supported notices.
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
			{}
		);
	} );

	/**
	 * Dismiss a notice for a given time.
	 *
	 * @param {string} notice - The name of the notice to dismiss.
	 * @param {number} [dismissDuration=-1] - The number of seconds to dismiss the notice for. -1 means forever.
	 */
	const dismissNotice = useCallback( ( notice, dismissDuration = -1 ) => {
		const reappearance_time = calculateReappearanceTime( dismissDuration );
		// Optimistically update the dismissed notices.
		setDismissedNotices( notices => ( { ...notices, ...{ [ notice ]: reappearance_time } } ) );

		apiFetch( {
			path: `/wp/v2/settings`,
			method: 'POST',
			data: { jetpack_social_dismissed_notices: { [ notice ]: reappearance_time } },
		} );
	}, [] );

	/**
	 * Check if a notice should be shown.
	 *
	 * @param {string} notice - The name of the notice to check.
	 * @returns {boolean} - Whether the notice should be shown.
	 */
	const shouldShowNotice = useCallback(
		notice => {
			const noticeReappearanceTime = dismissedNotices[ notice ];

			// We do not show the notice if it has been dismissed forever, or the reappearance time is in the future.
			if ( noticeReappearanceTime === 0 || noticeReappearanceTime > Date.now() ) {
				return false;
			}

			return true;
		},
		[ dismissedNotices ]
	);

	return useMemo(
		() => ( { dismissedNotices, shouldShowNotice, dismissNotice, NOTICES } ),
		[ dismissedNotices, shouldShowNotice, dismissNotice ]
	);
}
