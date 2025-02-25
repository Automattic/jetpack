import { getAdminUrl } from '@automattic/jetpack-script-data';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button, Icon, Spinner, PanelBody } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { createInterpolateElement, useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { installAndActivatePlugin, activatePlugin } from '../../util/plugin-management';
import PluginActionButton from './plugin-action-button';
import './styles.css';

const AkismetPanel = () => {
	const [ isInstalling, setIsInstalling ] = useState( false );
	const [ isActivating, setIsActivating ] = useState( false );
	const { invalidateResolution } = useDispatch( coreStore );
	const { tracks } = useAnalytics();

	const { pluginStatus, isLoading } = useSelect( select => {
		const installedPlugins = select( coreStore ).getPlugins();

		if ( ! installedPlugins ) {
			return { isLoading: true };
		}

		const plugin = installedPlugins.find( p => p.plugin === 'akismet/akismet' );

		return {
			isLoading: false,
			pluginStatus: {
				isInstalled: !! plugin,
				isActive: plugin?.status === 'active',
			},
		};
	}, [] );

	const { isInstalled = false, isActive = false } = pluginStatus || {};

	const handleButtonClick = useCallback( () => {
		const func = isInstalled ? activatePlugin : installAndActivatePlugin;
		const arg = isInstalled ? 'akismet/akismet' : 'akismet';
		const isActivationCall = func === activatePlugin;

		setIsInstalling( true );
		setIsActivating( isActivationCall );

		tracks.recordEvent( 'jetpack_forms_upsell_akismet_click' );

		func( arg ).finally( () => {
			invalidateResolution( 'getPlugins' );
			setIsInstalling( false );
			setIsActivating( false );
		} );
	}, [ isInstalled, setIsInstalling, setIsActivating, invalidateResolution, tracks ] );

	return (
		<PanelBody title={ __( 'Spam protection', 'jetpack-forms' ) } initialOpen={ false }>
			<div className="akismet-panel__content" aria-live="polite">
				{ isLoading && (
					<div className="akismet-panel__status">
						<div>
							<Spinner />
							<span>{ __( 'Checking plugin status…', 'jetpack-forms' ) }</span>
						</div>
					</div>
				) }

				{ ! isLoading && ! pluginStatus && (
					<div className="akismet-panel__status">
						<Icon icon="warning" />
						<span>
							{ __(
								'Unable to determine plugin status. Please refresh the page.',
								'jetpack-forms'
							) }
						</span>
					</div>
				) }

				{ ! isLoading && pluginStatus && ! isInstalled && (
					<div className="akismet-panel__panel">
						<div className="akismet-panel__panel-content">
							<div>
								{ createInterpolateElement(
									__(
										"Add one-click spam protection for your forms with <a>Akismet</a>. Simply install the plugin and you're set.",
										'jetpack-forms'
									),
									{
										a: (
											<a
												href="https://wordpress.org/plugins/akismet/"
												target="_blank"
												rel="noopener noreferrer"
											/>
										),
									}
								) }
							</div>
							<PluginActionButton
								isInstalling={ isInstalling }
								isActivating={ isActivating }
								isInstalled={ isInstalled }
								onClick={ handleButtonClick }
							/>
						</div>
					</div>
				) }

				{ ! isLoading && isInstalled && ! isActive && (
					<div className="akismet-panel__panel">
						<div className="akismet-panel__panel-content">
							<div>
								{ __(
									"You already have the plugin installed, but it's not activated.",
									'jetpack-forms'
								) }
							</div>
							<PluginActionButton
								isInstalling={ isInstalling }
								isActivating={ isActivating }
								isInstalled={ isInstalled }
								onClick={ handleButtonClick }
							/>
						</div>
					</div>
				) }

				{ ! isLoading && isInstalled && isActive && (
					<>
						<p>
							{ createInterpolateElement(
								__( 'Your forms are protected from spam with <a>Akismet</a>!', 'jetpack-forms' ),
								{
									a: (
										<a
											href="https://akismet.com/support/getting-started/using-akismet-with-your-contact-forms/"
											target="_blank"
											rel="noopener noreferrer"
										/>
									),
								}
							) }
						</p>
						{ getAdminUrl() && (
							<Button
								variant="secondary"
								href={ `${ getAdminUrl() }admin.php?page=jetpack-forms#/responses?status=spam` }
								target="_blank"
								rel="noopener noreferrer"
								__next40pxDefaultSize={ true }
							>
								{ __( 'Review spam', 'jetpack-forms' ) }
							</Button>
						) }
					</>
				) }
			</div>
		</PanelBody>
	);
};

export default AkismetPanel;
