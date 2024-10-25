/**
 * External dependencies
 */
import { createReduxStore, register } from '@wordpress/data';
/**
 * Internal dependencies
 */
import actions from './actions.js';
import reducer from './reducer.js';
import selectors from './selectors.js';

export const STORE_NAME = 'jetpack-ai/logo-generator';

const jetpackAiLogoGeneratorStore = createReduxStore( STORE_NAME, {
	// @ts-expect-error -- TSCONVERSION
	__experimentalUseThunks: true,

	actions,

	reducer,

	selectors,
} );

register( jetpackAiLogoGeneratorStore );
