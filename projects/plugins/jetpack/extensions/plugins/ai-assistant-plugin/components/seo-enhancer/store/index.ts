/**
 * External dependencies
 */
import { JETPACK_MODULES_STORE_ID, isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import { createReduxStore, register, select } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { FEATURES } from '../constants';
import * as actions from './actions';
import reducer from './reducer';
import * as selectors from './selectors';
import type { JetpackModuleSelector } from '../types';
export const STORE_NAME = 'jetpack/seo-enhancer';

let isAutoEnhanceEnabled = false;

try {
	// Will always be false on simple sites, as jetpack modules request will return 404
	if ( ! isSimpleSite() ) {
		const seoModuleSettings = (
			select( JETPACK_MODULES_STORE_ID ) as JetpackModuleSelector
		 ).getJetpackModules()[ 'seo-tools' ];
		const enhancerAvailable =
			seoModuleSettings && 'ai_seo_enhancer_enabled' in seoModuleSettings.options;
		isAutoEnhanceEnabled =
			enhancerAvailable && seoModuleSettings.options?.ai_seo_enhancer_enabled?.current_value;
	}
} catch {
	isAutoEnhanceEnabled = false;
}

function getInitialState() {
	const features = FEATURES.reduce(
		( acc, feature ) => {
			acc[ feature ] = true;
			return acc;
		},
		{} as Record< ( typeof FEATURES )[ number ], boolean >
	);

	try {
		const storedFeatures = localStorage.getItem( 'jetpack-seo-enhancer-features' );
		const parsedFeatures = storedFeatures ? JSON.parse( storedFeatures ) : {};

		for ( const feature of FEATURES ) {
			features[ feature ] = parsedFeatures[ feature ] ?? true;
		}
	} catch {
		// Use default feature values
	}

	return {
		isBusy: false,
		isTogglingAutoEnhance: false,
		isAutoEnhanceEnabled,
		busyImages: {},
		failedImages: {},
		features,
	};
}

export const store = createReduxStore( STORE_NAME, {
	reducer,
	selectors,
	actions,
	initialState: getInitialState(),
} );

register( store );
