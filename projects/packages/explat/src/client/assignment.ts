import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

export const fetchExperimentAssignment = async ( {
	experimentName,
	anonId,
}: {
	experimentName: string;
	anonId: string | null;
} ): Promise< unknown > => {
	const params = {
		experiment_name: experimentName,
		anon_id: anonId ?? undefined,
		as_connected_user: false,
	};
	const assignmentsRequestUrl = addQueryArgs( 'jetpack/v4/explat/assignments', params );

	return await apiFetch( { path: assignmentsRequestUrl } );
};
