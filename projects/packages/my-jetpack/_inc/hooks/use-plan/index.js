/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

// Site plan is provided by the `/my-jetpack/v1/site` endpoint response.
const REST_API_SITE_PLANS_ENDPOINT = 'my-jetpack/v1/site';

/**
 * Map plan data to a more usable format.
 *
 * @param {object} plan - raw plan data.
 * @returns {object} enriched plan data
 */
function mapPlanData( plan = {} ) {
	return {
		...plan,
		name: plan.product_name,
		shorName: plan.product_name_short,
		billingPeriod: sprintf(
			/* translators: placeholder is the billing period of the plan (e.g. Montly, Annual, ...) */
			__( '%s subscription', 'jetpack-my-jetpack' ),
			plan.billing_period
		),
	};
}

/**
 * React custom hook to get the site plan data.
 *
 * @returns {object} site plan data
 */
export default function usePlan() {
	const [ data, setData ] = useState( {} );

	useEffect( () => {
		apiFetch( { path: REST_API_SITE_PLANS_ENDPOINT } )
			.then( res => setData( mapPlanData( res?.plan ) ) )
			.catch( () => setData( {} ) );
	}, [ setData ] );

	return data;
}
