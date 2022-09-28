import apiFetch from '@wordpress/api-fetch';
import { Spinner, PanelBody, BaseControl } from '@wordpress/components';
import { useState, useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import CRMPluginState from './jetpack-crm-integration-settings-plugin-state';

const fetchCRMData = ( setHasCRMDataError, setCRMData, setIsFetchingCRMData ) => {
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
};

const CRMPluginData = ( {
	isFetchingCRMData,
	hasCRMDataError,
	crmData,
	setCRMData,
	jetpackCRM,
	setAttributes,
	onCRMPluginClick,
	isInstalling,
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
			onCRMPluginClick={ onCRMPluginClick }
			isInstalling={ isInstalling }
		/>
	);
};

const CRMIntegrationSettings = ( { jetpackCRM, setAttributes } ) => {
	const [ isFetchingCRMData, setIsFetchingCRMData ] = useState( true );
	const [ hasCRMDataError, setHasCRMDataError ] = useState( false );
	const [ crmData, setCRMData ] = useState();
	const [ isInstalling, setIsInstalling ] = useState( false );

	const onCRMPluginClick = useCallback(
		( func, arg ) => {
			setIsInstalling( true );
			func( arg )
				.catch( () => {
					setHasCRMDataError( true );
				} )
				.finally( () => {
					setIsInstalling( false );
					setIsFetchingCRMData( true );
					fetchCRMData( setHasCRMDataError, setCRMData, setIsFetchingCRMData );
				} );
		},
		[ setIsInstalling, setHasCRMDataError, setIsFetchingCRMData ]
	);

	useEffect( () => {
		fetchCRMData( setHasCRMDataError, setCRMData, setIsFetchingCRMData );
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
					isInstalling={ isInstalling }
					onCRMPluginClick={ onCRMPluginClick }
				/>
			</BaseControl>
		</PanelBody>
	);
};

export default CRMIntegrationSettings;
