import apiFetch from '@wordpress/api-fetch';
import { useState } from '@wordpress/element';

const useRecommendedTagsDismissed = ( initial: boolean ) => {
	const [ isDismissed, setRecommendedTagsDismissed ] = useState( initial );

	/**
	 * Update the value to dismiss the recommended tags modal
	 *
	 * @param value - The value to update.
	 */
	function updateIsDismissed( value: boolean ) {
		apiFetch( {
			method: 'PUT',
			path: '/wpcom/v2/block-editor/recommended-tags-modal-dismissed',
			data: { wpcom_recommended_tags_modal_dismissed: value },
		} ).finally( () => {
			setRecommendedTagsDismissed( value );
		} );
	}
	return { isDismissed, updateIsDismissed };
};

export default useRecommendedTagsDismissed;
