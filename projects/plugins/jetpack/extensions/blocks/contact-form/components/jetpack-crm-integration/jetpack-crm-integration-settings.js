/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { Spinner, PanelBody, BaseControl } from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import CRMPluginState from './jetpack-crm-integration-settings-plugin-state';

const CRMPluginData = ( {
	isFetchingCRMData,
	hasCRMDataError,
	crmData,
	setCRMData,
	jetpackCRM,
	setAttributes,
} ) => {
	if ( isFetchingCRMData ) {
		return <Spinner />;
	}
	if ( hasCRMDataError ) {
		// Don`t show anything if the CRM plugin data can't be accessed.
		return null;
	}

	return (
		<CRMPluginState
			crmData={ crmData }
			setCRMData={ setCRMData }
			jetpackCRM={ jetpackCRM }
			setAttributes={ setAttributes }
		/>
	);
};

const CRMIntegrationSettings = ( { jetpackCRM, setAttributes } ) => {
	const [ isFetchingCRMData, setIsFetchingCRMData ] = useState( true );
	const [ hasCRMDataError, setHasCRMDataError ] = useState( false );
	const [ crmData, setCRMData ] = useState();

	useEffect( () => {
		apiFetch( {
			path: '/jetpack/v4/jetpack_crm',
		} )
			.then( result => {
				if ( result.error ) {
					throw result.message;
				}
				setHasCRMDataError( false );
				setCRMData( result );
			} )
			.catch( () => setHasCRMDataError( true ) )
			.finally( () => setIsFetchingCRMData( false ) );
	}, [] );

	return (
		<PanelBody title={ __( 'CRM Integration', 'jetpack' ) } initialOpen={ false }>
			<BaseControl>
				<CRMPluginData
					isFetchingCRMData={ isFetchingCRMData }
					hasCRMDataError={ hasCRMDataError }
					crmData={ crmData }
					setCRMData={ setCRMData }
					jetpackCRM={ jetpackCRM }
					setAttributes={ setAttributes }
				/>
			</BaseControl>
		</PanelBody>
	);
};

export default CRMIntegrationSettings;
