import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import debugFactory from 'debug';

const debug = debugFactory( 'jetpack-explat:client:assignment' );

const fetchExperimentAssignment =
	( asConnectedUser = false ) =>
	async ( {
		experimentName,
		anonId,
	}: {
		experimentName: string;
		anonId: string | null;
	} ): Promise< unknown > => {
		if ( ! anonId ) {
			debug( 'anonId is null' );
			throw new Error( `Tracking is disabled, can't fetch experimentAssignment` );
		}

		const params = {
			experiment_name: experimentName,
			anon_id: anonId ?? undefined,
			as_connected_user: asConnectedUser,
		};

		debug( 'params', params );

		const assignmentsRequestUrl = addQueryArgs( 'jetpack/v4/explat/assignments', params );

		debug( 'assignmentsRequestUrl', assignmentsRequestUrl );

		return await apiFetch( { path: assignmentsRequestUrl } );
	};

export const fetchExperimentAssignmentAnonymously = fetchExperimentAssignment( false );
export const fetchExperimentAssignmentWithAuth = fetchExperimentAssignment( true );
