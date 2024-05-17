import apiFetch from '@wordpress/api-fetch';
import camelize from 'camelize';

const API = {
	fetchWaf: () =>
		apiFetch( {
			path: 'jetpack-protect/v1/waf',
			method: 'GET',
		} ).then( camelize ),

	toggleWaf: () =>
		apiFetch( {
			method: 'POST',
			path: 'jetpack-protect/v1/toggle-waf',
		} ),

	updateWaf: data =>
		apiFetch( {
			method: 'POST',
			path: 'jetpack/v4/waf',
			data,
		} ),

	wafSeen: () =>
		apiFetch( {
			path: 'jetpack-protect/v1/waf-seen',
			method: 'POST',
		} ),

	wafUpgradeSeen: () =>
		apiFetch( {
			path: 'jetpack-protect/v1/waf-upgrade-seen',
			method: 'POST',
		} ),

	fetchOnboardingProgress: () =>
		apiFetch( {
			path: 'jetpack-protect/v1/onboarding-progress',
			method: 'GET',
		} ),

	completeOnboardingSteps: stepIds =>
		apiFetch( {
			path: 'jetpack-protect/v1/onboarding-progress',
			method: 'POST',
			data: { step_ids: stepIds },
		} ),
};

export default API;
