import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { BaseControl, Button, Icon, Spinner, PanelBody } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { installAndActivatePlugin, activatePlugin } from '../../util/plugin-management';

const PluginIntegrationPanel = ( {
	pluginSlug,
	pluginPath,
	installText,
	activateText,
	description,
	installEventName,
	activateEventName,
	children,
	title,
	initialOpen = false,
} ) => {
	const [ isInstalling, setIsInstalling ] = useState( false );
	const [ isActivating, setIsActivating ] = useState( false );
	const { invalidateResolution } = useDispatch( coreStore );
	const { tracks } = useAnalytics();

	const { pluginStatus, isLoading } = useSelect( () => {
		const installedPlugins = window?.wp?.data?.select( 'core' )?.getPlugins?.();

		if ( ! installedPlugins ) {
			return { isLoading: true };
		}

		const plugin = installedPlugins.find( p => p.plugin === pluginPath );

		return {
			isLoading: false,
			pluginStatus: {
				isInstalled: !! plugin,
				isActive: plugin?.status === 'active',
			},
		};
	}, [ pluginPath ] );

	const onPluginClick = useCallback(
		( func, arg ) => {
			const isActivationCall = func === activatePlugin;
			setIsInstalling( true );
			setIsActivating( isActivationCall );

			func( arg ).finally( () => {
				invalidateResolution( 'getPlugins' );
				setIsInstalling( false );
				setIsActivating( false );
			} );
		},
		[ setIsInstalling, setIsActivating, invalidateResolution ]
	);

	const getButtonLabel = () => {
		if ( isActivating ) {
			return __( 'Activating…', 'jetpack-forms' );
		}
		if ( isInstalling ) {
			return __( 'Installing…', 'jetpack-forms' );
		}
		return pluginStatus.isInstalled ? activateText : installText;
	};

	const getContent = () => {
		if ( isLoading ) {
			return (
				<BaseControl __nextHasNoMarginBottom={ true }>
					<div style={ { display: 'flex', alignItems: 'center', gap: '8px' } }>
						<Spinner />
						<span>{ __( 'Checking plugin status…', 'jetpack-forms' ) }</span>
					</div>
				</BaseControl>
			);
		}

		if ( ! pluginStatus ) {
			return <BaseControl __nextHasNoMarginBottom={ true } />;
		}

		return (
			<BaseControl __nextHasNoMarginBottom={ true }>
				<div aria-live="polite">
					{ pluginStatus.isActive ? (
						children
					) : (
						<p className="jetpack-contact-form__integration-panel">
							<em style={ { color: 'rgba(38, 46, 57, 0.7)' } }>
								{ pluginStatus.isInstalled ? (
									<>
										{ __(
											"You already have the plugin installed, but it's not activated.",
											'jetpack-forms'
										) }
										<br />
									</>
								) : (
									<>
										{ description }
										<br />
									</>
								) }
								{ isInstalling ? (
									<Button
										variant="secondary"
										icon={
											<Icon style={ { animation: 'rotation 2s infinite linear' } } icon="update" />
										}
										disabled
										aria-label={ getButtonLabel() }
									>
										{ getButtonLabel() }
									</Button>
								) : (
									<Button
										variant="secondary"
										onClick={ () => {
											const eventName = pluginStatus.isInstalled
												? activateEventName
												: installEventName;
											const func = pluginStatus.isInstalled
												? activatePlugin
												: installAndActivatePlugin;
											const arg = pluginStatus.isInstalled ? pluginPath : pluginSlug;

											tracks.recordEvent( eventName );
											onPluginClick( func, arg );
										} }
									>
										{ getButtonLabel() }
									</Button>
								) }
							</em>
						</p>
					) }
				</div>
			</BaseControl>
		);
	};

	return (
		<PanelBody title={ title } initialOpen={ initialOpen }>
			{ getContent() }
		</PanelBody>
	);
};

export default PluginIntegrationPanel;
