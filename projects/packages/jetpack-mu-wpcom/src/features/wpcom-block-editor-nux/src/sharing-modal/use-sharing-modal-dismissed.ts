import apiFetch from '@wordpress/api-fetch';
import { useState } from '@wordpress/element';

const useSharingModalDismissed = ( initial: boolean ) => {
	const [ isDismissed, setSharingModalDismissed ] = useState( initial );

	/**
	 * Update the value to dismiss the sharing modal
	 *
	 * @param value - The value to update.
	 */
	function updateIsDismissed( value: boolean ) {
		apiFetch( {
			method: 'PUT',
			path: '/wpcom/v2/block-editor/sharing-modal-dismissed',
			data: { wpcom_sharing_modal_dismissed: value },
		} ).finally( () => {
			setSharingModalDismissed( value );
		} );
	}
	return { isDismissed, updateIsDismissed };
};

export default useSharingModalDismissed;
