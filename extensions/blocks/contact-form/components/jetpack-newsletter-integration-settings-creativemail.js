/**
 * External dependencies
 */
import { Spinner, Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { get } from 'lodash';
import { useCallback, useState, useEffect } from '@wordpress/element';
import { getPlugins } from './../../../shared/plugin-management';

import CreativeMailPluginErrorState from './jetpack-newsletter-integration-settings-error-state';
import CreativeMailPluginState, {
	pluginStateEnum,
} from './jetpack-newsletter-integration-settings-plugin-state';

const pluginPathWithoutPhp = 'creative-mail-by-constant-contact/creative-mail-plugin';
const pluginPath = `${ pluginPathWithoutPhp }.php`;

const useOnCreativeMailPluginPromise = ( setPluginError, setIsInstalling, setPluginState ) => {
	const onCreativeMailPluginClick = useCallback(
		( func, arg ) => {
			setPluginError( undefined );
			setIsInstalling( true );
			func( arg )
				.then( () => {
					setPluginState( pluginStateEnum.ACTIVE );
				} )
				.catch( err => {
					setPluginError( err );
				} )
				.finally( () => setIsInstalling( false ) );
		},
		[ setIsInstalling, setPluginError, setPluginState ]
	);
	return onCreativeMailPluginClick;
};

const CreativeMailPluginFetched = ( { pluginState, setPluginState } ) => {
	const [ pluginError, setPluginError ] = useState();
	const [ isInstalling, setIsInstalling ] = useState( false );
	const onCreativeMailPluginClick = useOnCreativeMailPluginPromise(
		setPluginError,
		setIsInstalling,
		setPluginState
	);
	if ( pluginError ) {
		return <CreativeMailPluginErrorState error={ pluginError } />;
	}
	return (
		<CreativeMailPluginState
			pluginState={ pluginState }
			onCreativeMailPluginClick={ onCreativeMailPluginClick }
			isInstalling={ isInstalling }
		/>
	);
};

const CreativeMailPluginsLoaded = ( {
	isFetchingPlugins,
	hasError,
	pluginState,
	setPluginState,
} ) => {
	if ( isFetchingPlugins ) {
		return <Spinner />;
	}
	if ( hasError ) {
		return (
			<Notice isDismissible={ false } status="error">
				{ __( "Couldn't access the plugins. Please try again later.", 'jetpack' ) }
			</Notice>
		);
	}
	return (
		<CreativeMailPluginFetched pluginState={ pluginState } setPluginState={ setPluginState } />
	);
};

const CreativeMailPlugin = () => {
	const [ isFetchingPlugins, setIsFetchingPlugins ] = useState( true );
	const [ hasError, setHasError ] = useState( false );
	const [ pluginState, setPluginState ] = useState( pluginStateEnum.NOT_INSTALLED );

	useEffect( () => {
		getPlugins()
			.then( plugins => {
				setHasError( false );
				get( plugins, pluginPath ) && get( plugins, [ pluginPath, 'active' ] )
					? setPluginState( pluginStateEnum.ACTIVE )
					: setPluginState( pluginStateEnum.INSTALLED );
			} )
			.catch( () => setHasError( true ) )
			.finally( () => setIsFetchingPlugins( false ) );
	}, [ setPluginState, setIsFetchingPlugins, setHasError ] );
	return (
		<CreativeMailPluginsLoaded
			isFetchingPlugins={ isFetchingPlugins }
			hasError={ hasError }
			pluginState={ pluginState }
			setPluginState={ setPluginState }
		/>
	);
};

export default CreativeMailPlugin;
