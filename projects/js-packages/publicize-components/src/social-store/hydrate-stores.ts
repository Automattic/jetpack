import { store as coreStore } from '@wordpress/core-data';
import { dispatch, select } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { getSocialScriptData } from '../utils';

/**
 * Hydrate the data stores
 */
export async function hydrateStores() {
	const wpcomEntities = select( coreStore ).getEntitiesConfig( 'wpcom/v2' );

	if ( ! wpcomEntities.some( ( { name } ) => name === 'publicize/services' ) ) {
		const {
			addEntities,
			receiveEntityRecords,
			// @ts-expect-error finishResolution exists but it's not typed
			finishResolution,
		} = dispatch( coreStore );

		await addEntities( [
			{
				kind: 'wpcom/v2',
				name: 'publicize/services',
				baseURL: '/wpcom/v2/publicize/services',
				label: __( 'Publicize services', 'jetpack-publicize-components' ),
			},
		] );

		// @ts-expect-error Only 3 arguments are required, rest are optional but types expect 7
		await receiveEntityRecords(
			'wpcom/v2',
			'publicize/services',
			getSocialScriptData()?.supported_services,
			true
		);

		await finishResolution( 'getEntityRecords', [ 'wpcom/v2', 'publicize/services' ] );
	}
}
