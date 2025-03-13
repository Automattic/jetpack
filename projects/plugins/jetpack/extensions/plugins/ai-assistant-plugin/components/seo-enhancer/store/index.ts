/**
 * External dependencies
 */
import { JETPACK_MODULES_STORE_ID } from '@automattic/jetpack-shared-extension-utils';
import { createReduxStore, register, select } from '@wordpress/data';
/**
 * Internal dependencies
 */
import * as actions from './actions';
import reducer from './reducer';
import * as selectors from './selectors';
import type { JetpackModuleSelector } from '../types';
export const STORE_NAME = 'jetpack/seo-enhancer';

let enhancerEnabled;

try {
	const seoModuleSettings = (
		select( JETPACK_MODULES_STORE_ID ) as JetpackModuleSelector
	 ).getJetpackModules()[ 'seo-tools' ];
	const enhancerAvailable =
		seoModuleSettings && 'ai_seo_enhancer_enabled' in seoModuleSettings.options;
	enhancerEnabled =
		enhancerAvailable && seoModuleSettings.options?.ai_seo_enhancer_enabled?.current_value;
} catch {
	enhancerEnabled = false;
}

export const store = createReduxStore( STORE_NAME, {
	reducer,
	selectors,
	actions,
	initialState: {
		isBusy: false,
		isTogglingAutoEnhance: false,
		isAutoEnhanceEnabled: enhancerEnabled,
	},
} );

register( store );
