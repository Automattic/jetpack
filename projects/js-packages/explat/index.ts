/**
 * External dependencies
 */
import { createExPlatClient } from '@automattic/explat-client';
import createExPlatClientReactHelpers from '@automattic/explat-client-react-helpers';

/**
 * Internal dependencies
 */
import { isDevelopmentMode } from './src/utils';
import { logError } from './src/error';
import { fetchExperimentAssignment } from './src/assignment';
import { getAnonId, initializeAnonId } from './src/anon';

declare global {
	interface Window {
		jetpackTracks: {
			isEnabled: boolean;
		};
	}
}

/* @todo Jetpack: can Jetpack users disable event tracking? */
/* @todo Jetpack: Remove this after we clarify if we have an equivalent of "Enable/Disable tracks". */
window.jetpackTracks = {
	isEnabled: true,
};

export const initializeExPlat = (): void => {
	if ( window.jetpackTracks?.isEnabled ) {
		initializeAnonId().catch( e => logError( { message: e.message } ) );
	}
};

initializeExPlat();

const exPlatClient = createExPlatClient( {
	fetchExperimentAssignment,
	getAnonId,
	logError,
	isDevelopmentMode,
} );

export const { loadExperimentAssignment, dangerouslyGetExperimentAssignment } = exPlatClient;
const exPlatClientReactHelpers = createExPlatClientReactHelpers( exPlatClient );
export const { useExperiment, Experiment, ProvideExperimentData } = exPlatClientReactHelpers;
