/**
 * External dependencies
 */
import { stringify } from 'qs';

const EXPLAT_API_VERSION = '0.1.0';

export const fetchExperimentAssignment = async ( {
	experimentName,
	anonId,
}: {
	experimentName: string;
	anonId: string | null;
} ): Promise< unknown > => {
	const params = stringify( {
		experiment_name: experimentName,
		anon_id: anonId ?? undefined,
	} );

	/* @todo Jetpack: dynamically replace "wpcom" with relevant platform and point to Jetpack API*/
	return await fetch(
		`https://public-api.wordpress.com/wpcom/v2/experiments/${ EXPLAT_API_VERSION }/assignments/jetpack?${ params }`
	);
};
