/**
 * External dependencies
 */
import { stringify } from 'qs';
import { version as EXPLAT_VERSION } from '../package.json';

export const fetchExperimentAssignment = async ( {
	experimentName,
	anonId,
}: {
	experimentName: string;
	anonId: string | null;
} ): Promise< unknown > => {
	if ( ! window.jetpackTracks?.isEnabled ) {
		throw new Error( `Tracking is disabled, can't fetch experimentAssignment` );
	}

	const params = stringify( {
		experiment_name: experimentName,
		anon_id: anonId ?? undefined,
	} );

	/* @todo Jetpack: dynamically replace "wpcom" with relevant platform and point to Jetpack API*/
	return await fetch(
		`https://public-api.wordpress.com/wpcom/v2/experiments/${ EXPLAT_VERSION }/assignments/wpcom?${ params }`
	);
};
