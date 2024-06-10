/**
 * External dependencies
 */
import { createExPlatClient } from '@automattic/explat-client';
import createExPlatClientReactHelpers from '@automattic/explat-client-react-helpers';
/**
 * Internal dependencies
 */
import { getAnonId, initializeAnonId } from './anon';
import { fetchExperimentAssignment } from './assignment';
import { logError } from './error';
import { isDevelopmentMode } from './utils';

export const initializeExPlat = (): void => {
	initializeAnonId().catch( e => logError( { message: e.message } ) );
};

initializeExPlat();

const exPlatClient = createExPlatClient( {
	fetchExperimentAssignment,
	getAnonId,
	logError,
	isDevelopmentMode,
} );

export const { loadExperimentAssignment, dangerouslyGetExperimentAssignment } = exPlatClient;

export const { useExperiment, Experiment, ProvideExperimentData } =
	createExPlatClientReactHelpers( exPlatClient );
