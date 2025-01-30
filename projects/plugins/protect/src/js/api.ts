import { type FixersStatus, type ScanStatus, type WafStatus } from '@automattic/jetpack-scan';
import apiFetch from '@wordpress/api-fetch';
import camelize from 'camelize';
import type { ProductData } from './types/products';

const API = {
	getWaf: (): Promise< WafStatus > =>
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
		} ).then( camelize ),

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

	getOnboardingProgress: () =>
		apiFetch( {
			path: 'jetpack-protect/v1/onboarding-progress',
			method: 'GET',
		} ),

	completeOnboardingSteps: ( stepIds: string[] ) =>
		apiFetch( {
			path: 'jetpack-protect/v1/onboarding-progress',
			method: 'POST',
			data: { step_ids: stepIds },
		} ),

	getScanHistory: (): Promise< ScanStatus | false > =>
		apiFetch( {
			path: 'jetpack-protect/v1/scan-history',
			method: 'GET',
		} ).then( camelize ),

	scan: () =>
		apiFetch( {
			path: `jetpack-protect/v1/scan`,
			method: 'POST',
		} ),

	getScanStatus: (): Promise< ScanStatus > =>
		apiFetch( {
			path: 'jetpack-protect/v1/status?hard_refresh=true',
			method: 'GET',
		} ).then( camelize ),

	fixThreats: ( threatIds: number[] ): Promise< FixersStatus > =>
		apiFetch( {
			path: `jetpack-protect/v1/fix-threats`,
			method: 'POST',
			data: { threat_ids: threatIds },
		} ).then( camelize ),

	getFixersStatus: ( threatIds: number[] ): Promise< FixersStatus > => {
		const path = threatIds.reduce( ( carryPath, threatId ) => {
			return `${ carryPath }threat_ids[]=${ threatId }&`;
		}, 'jetpack-protect/v1/fix-threats-status?' );

		return apiFetch( {
			path,
			method: 'GET',
		} ).then( camelize );
	},

	ignoreThreat: ( threatId: number ) =>
		apiFetch( {
			path: `jetpack-protect/v1/ignore-threat?threat_id=${ threatId }`,
			method: 'POST',
		} ),

	unIgnoreThreat: ( threatId: number ) =>
		apiFetch( {
			path: `jetpack-protect/v1/unignore-threat?threat_id=${ threatId }`,
			method: 'POST',
		} ),

	checkCredentials: () =>
		apiFetch( {
			path: 'jetpack-protect/v1/check-credentials',
			method: 'POST',
		} ) as Promise< [ Record< string, unknown > ] >,

	checkPlan: () =>
		apiFetch( {
			path: 'jetpack-protect/v1/check-plan',
			method: 'GET',
		} ),

	getProductData: () =>
		(
			apiFetch( {
				path: '/my-jetpack/v1/site/products?products=scan',
				method: 'GET',
			} ) as Promise< { [ key: string ]: ProductData } >
		 ).then( products => camelize( products?.scan ) ),
};

export default API;
