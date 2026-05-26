import { __ } from '@wordpress/i18n';

export const CREATE_NOTICE = 'CREATE_NOTICE';
export const REMOVE_NOTICE = 'REMOVE_NOTICE';

let createNoticeCounter = 0;

/**
 * Create global notice
 *
 * @param {*} status  - success, error, info or warning.
 * @param {*} text    - the text to show.
 * @param {*} options - Options.
 * @return {object} - action object.
 */
export function createNotice( status, text, options = {} ) {
	const notice = {
		id: options.id || ++createNoticeCounter,
		duration: options.duration ?? 2000,
		showDismiss: typeof options.showDismiss === 'boolean' ? options.showDismiss : true,
		status: status,
		text: text,
	};

	return {
		type: CREATE_NOTICE,
		notice: notice,
	};
}

/**
 * Remove notice by ID
 *
 * @param {*} noticeId - noticeID.
 * @return {object} - action object.
 */
export function removeNotice( noticeId ) {
	return { type: REMOVE_NOTICE, notice: { id: noticeId } };
}

export const successNotice = createNotice.bind( null, 'is-success' );
export const errorNotice = createNotice.bind( null, 'is-error' );
export const infoNotice = createNotice.bind( null, 'is-info' );
export const warningNotice = createNotice.bind( null, 'is-warning' );
export const updatingNotice = ( text = __( 'Updating settings…', 'jetpack-search-pkg' ) ) =>
	createNotice( 'is-info', text, { duration: 30000, id: 'search-updating-settings' } );
export const removeUpdatingNotice = () => removeNotice( 'search-updating-settings' );

export default {
	createNotice,
	removeNotice,
	successNotice,
	errorNotice,
	warningNotice,
	updatingNotice,
	removeUpdatingNotice,
};
