import { ONBOARDING_NAME_BY_PRODUCT_SLUG, ONBOARDING_ORDER } from './constants';

/**
 * Function to get an onboarding for the specific product
 *
 * @param {string} productSlug - slug of the product
 * @returns {string} onboarding name or null if onboarding not found
 */
export function getOnboardingNameByProductSlug( productSlug: string ) {
	const foundIndex = Object.values( ONBOARDING_NAME_BY_PRODUCT_SLUG ).findIndex( slugs =>
		slugs.includes( productSlug )
	);

	if ( -1 === foundIndex ) {
		return null;
	}

	return Object.keys( ONBOARDING_NAME_BY_PRODUCT_SLUG )[ foundIndex ];
}

/**
 * Function to get an onboarding priority
 *
 * @param {string} name - onboarding name
 * @returns {number} the onboarding priority
 * @throws exception when the requested onboarding is not in the ONBOARDING_ORDER array.
 */
function getOnboardingPriority( name: string ) {
	const index = ONBOARDING_ORDER.indexOf( name );

	if ( -1 === index ) {
		throw `The onboarding "${ name }" is not included in the ONBOARDING_ORDER`;
	}

	return index;
}

/**
 * Sorting function for array of recommendation onboardings.
 *
 * @param {string} a - left Onboarding name to compare
 * @param {string} b - right Onboarding name to compare
 * @returns {number} Value ( -1, 0, 1) to sort array in descending order
 */
export function sortByOnboardingPriority( a: string, b: string ) {
	return getOnboardingPriority( a ) - getOnboardingPriority( b );
}
