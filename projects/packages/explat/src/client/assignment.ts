import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import wpcomRequest, { canAccessWpcomApis } from 'wpcom-proxy-request';

const fetchExperimentAssignment =
	( asConnectedUser = false ) =>
	async ( {
		experimentName,
		anonId,
	}: {
		experimentName: string;
		anonId: string | null;
	} ): Promise< unknown > => {
		const platform = experimentName.split( '_' )[ 0 ];

		return canAccessWpcomApis()
			? wpcomRequest( {
					path: addQueryArgs( `/experiments/0.1.0/assignments/${ platform }`, {
						experiment_names: experimentName,
						anon_id: anonId ?? undefined,
					} ),
					apiNamespace: 'wpcom/v2',
			  } )
			: apiFetch( {
					path: addQueryArgs( 'jetpack/v4/explat/assignments', {
						experiment_name: experimentName,
						anon_id: anonId ?? undefined,
						as_connected_user: asConnectedUser,
						platform,
					} ),
			  } );
	};

export const fetchExperimentAssignmentAnonymously = fetchExperimentAssignment( false );
export const fetchExperimentAssignmentWithAuth = fetchExperimentAssignment( true );
