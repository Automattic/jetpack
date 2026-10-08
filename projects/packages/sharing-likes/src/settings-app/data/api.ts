import apiFetch from '@wordpress/api-fetch';
import type { Feature, Services, SettingKey, Settings, Status } from '../types';

const BASE = '/wpcom/v2/sharing-likes';

export type FeatureAction = 'switch-to-block' | 'activate';

export const fetchStatus = () => apiFetch< Status >( { path: `${ BASE }/status` } );

export const fetchSettings = () => apiFetch< Settings >( { path: `${ BASE }/settings` } );

export const fetchServices = () => apiFetch< Services >( { path: `${ BASE }/services` } );

/**
 * Save which services show, and in which order. Unknown IDs are dropped.
 *
 * @param visible - Services shown as buttons.
 * @param hidden  - Services behind the "More" button.
 * @return The services as now saved.
 */
export function saveServices( visible: string[], hidden: string[] ) {
	return apiFetch< Services >( {
		path: `${ BASE }/services`,
		method: 'PUT',
		data: { visible, hidden },
	} );
}

/**
 * Save one setting. The route refuses any key the screen does not show.
 *
 * @param key   - Setting.
 * @param value - New value.
 * @return Every setting the screen now shows.
 */
export function saveSetting< K extends SettingKey >( key: K, value: Settings[ K ] ) {
	return apiFetch< Settings >( {
		path: `${ BASE }/settings`,
		method: 'PUT',
		data: { [ key ]: value },
	} );
}

/**
 * Hand a feature to its block, or turn its module back on.
 *
 * @param feature - Feature.
 * @param action  - Action.
 * @return The new status.
 */
export function runFeatureAction( feature: Feature, action: FeatureAction ) {
	return apiFetch< Status >( { path: `${ BASE }/${ feature }/${ action }`, method: 'POST' } );
}
