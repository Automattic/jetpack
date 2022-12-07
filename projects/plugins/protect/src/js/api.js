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
};

export default API;
