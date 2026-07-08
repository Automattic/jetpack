import { store as coreStore } from '@wordpress/core-data';
import { dispatch, select } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { getSocialScriptData } from '../utils';

/**
 * Hydrate the data stores
 */
export async function hydrateStores() {
	const { addEntities, receiveEntityRecords, finishResolution } = dispatch( coreStore );

	const socialToggleBase = getSocialScriptData()?.api_paths?.socialToggleBase;

	const jetpackEntities = select( coreStore ).getEntitiesConfig( 'jetpack/v4' );
	if ( ! jetpackEntities.some( ( { name } ) => name === socialToggleBase ) ) {
		await addEntities( [
			{
				kind: 'jetpack/v4',
				name: socialToggleBase,
				baseURL: `/jetpack/v4/${ socialToggleBase }`,
				label: __( 'Social Settings', 'jetpack-publicize-pkg' ),
			},
		] );

		await receiveEntityRecords(
			'jetpack/v4',
			socialToggleBase,
			{ publicize: getSocialScriptData()?.is_publicize_enabled },
			true
		);

		await finishResolution( 'getEntityRecord', [ 'jetpack/v4', socialToggleBase ] );
	}

	const wpcomEntities = select( coreStore ).getEntitiesConfig( 'wpcom/v2' );

	if ( ! wpcomEntities.some( ( { name } ) => name === 'publicize/services' ) ) {
		await addEntities( [
			{
				kind: 'wpcom/v2',
				name: 'publicize/services',
				baseURL: '/wpcom/v2/publicize/services',
				label: __( 'Publicize services', 'jetpack-publicize-pkg' ),
			},
		] );

		await receiveEntityRecords(
			'wpcom/v2',
			'publicize/services',
			getSocialScriptData()?.supported_services,
			true
		);

		await finishResolution( 'getEntityRecords', [ 'wpcom/v2', 'publicize/services' ] );
	}

	if ( ! wpcomEntities.some( ( { name } ) => name === 'publicize/scheduled-actions' ) ) {
		await addEntities( [
			{
				kind: 'wpcom/v2',
				name: 'publicize/scheduled-actions',
				baseURL: '/wpcom/v2/publicize/scheduled-actions',
				label: __( 'Publicize scheduled actions', 'jetpack-publicize-pkg' ),
			},
		] );
	}

	if (
		! wpcomEntities.some( ( { name } ) => name === 'publicize/social-image-generator/font-options' )
	) {
		await addEntities( [
			{
				kind: 'wpcom/v2',
				name: 'publicize/social-image-generator/font-options',
				baseURL: '/wpcom/v2/publicize/social-image-generator/font-options',
				label: __( 'Publicize font options', 'jetpack-publicize-pkg' ),
			},
		] );
	}
}
