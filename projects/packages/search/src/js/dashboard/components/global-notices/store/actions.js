/**
 * External dependencies
 */
import { uniqueId } from 'lodash';
import { __ } from '@wordpress/i18n';

/**
 * @returns {object} - an action to set network busy.
 */
export const CREATE_NOTICE = 'CREATE_NOTICE';
export const REMOVE_NOTICE = 'REMOVE_NOTICE';

export function createNotice( status, text, options = {} ) {
	const notice = {
		id: options.id || uniqueId(),
		duration: options.duration ?? 2000,
		showDismiss: typeof options.showDismiss === 'boolean' ? options.showDismiss : true,
		isPersistent: options.isPersistent || false,
		displayOnNextPage: options.displayOnNextPage || false,
		status: status,
		text: text,
	};

	return {
		type: CREATE_NOTICE,
		notice: notice,
	};
}

export const successNotice = createNotice.bind( null, 'is-success' );
export const errorNotice = createNotice.bind( null, 'is-error' );
export const infoNotice = createNotice.bind( null, 'is-info' );
export const warningNotice = createNotice.bind( null, 'is-warning' );
export const updatingNotice = ( text = __( 'Updating settings...' ) ) =>
	createNotice( 'is-info', text, { duration: 2000, id: 'search-updating-settings' } );
export const removeUpdatingNotice = () => removeNotice( 'search-updating-settings' );

export function removeNotice( noticeId ) {
	return { type: REMOVE_NOTICE, notice: { id: noticeId } };
}

export default {
	createNotice,
	removeNotice,
	successNotice,
	errorNotice,
	warningNotice,
	updatingNotice,
	removeUpdatingNotice,
};
