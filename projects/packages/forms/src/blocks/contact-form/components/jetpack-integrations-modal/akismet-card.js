import { getRedirectUrl } from '@automattic/jetpack-components';
import { Button, ExternalLink, Icon, Spinner } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useIntegrationStatus, usePluginInstallation } from '../hooks';
import IntegrationCard from './integration-card';

const AkismetCard = ( { isExpanded, onToggle } ) => {
	const formSubmissionsUrl = window?.jpFormsBlocks?.defaults?.formsAdminUrl || '';

	const {
		isCheckingStatus,
		isInstalled,
		isActive,
		isConnected: akismetActiveWithKey,
		settingsUrl,
		refreshStatus,
	} = useIntegrationStatus( 'akismet' );

	const { isInstalling, installPlugin } = usePluginInstallation(
		'akismet',
		'akismet/akismet',
		isInstalled,
		'jetpack_forms_upsell_akismet_click'
	);

	const handleInstallAction = async () => {
		const success = await installPlugin();
		if ( success ) {
			refreshStatus();
		}
	};

	const getButtonText = () => {
		return (
			( isInstalling && isInstalled && __( 'Activating…', 'jetpack-forms' ) ) ||
			( isInstalling && __( 'Installing…', 'jetpack-forms' ) ) ||
			( isInstalled && __( 'Activate', 'jetpack-forms' ) ) ||
			__( 'Install', 'jetpack-forms' )
		);
	};

	const renderContent = () => {
		if ( isCheckingStatus ) {
			return <Spinner />;
		}

		if ( ! isInstalled ) {
			return (
				<div>
					<p>
						{ createInterpolateElement(
							__(
								"Add one-click spam protection for your forms with <a>Akismet</a>. Simply install the plugin and you're set.",
								'jetpack-forms'
							),
							{
								a: <ExternalLink href={ getRedirectUrl( 'akismet-wordpress-org' ) } />,
							}
						) }
					</p>
					<Button
						variant="primary"
						onClick={ handleInstallAction }
						disabled={ isInstalling }
						icon={ isInstalling ? <Icon icon="update" className="is-spinning" /> : undefined }
						__next40pxDefaultSize={ true }
					>
						{ getButtonText() }
					</Button>
				</div>
			);
		}

		if ( ! isActive ) {
			return (
				<div>
					<p>
						{ __( "You already have Akismet installed, but it's not activated.", 'jetpack-forms' ) }
					</p>
					<Button
						variant="primary"
						onClick={ handleInstallAction }
						disabled={ isInstalling }
						icon={ isInstalling ? <Icon icon="update" className="is-spinning" /> : undefined }
						__next40pxDefaultSize={ true }
					>
						{ getButtonText() }
					</Button>
				</div>
			);
		}

		if ( ! akismetActiveWithKey ) {
			return (
				<div>
					<p>
						{ createInterpolateElement(
							__(
								'Akismet is active! There is one step left. Please add your <a>Akismet key</a>.',
								'jetpack-forms'
							),
							{
								a: <ExternalLink href={ settingsUrl } />,
							}
						) }
					</p>
					<Button
						variant="primary"
						href={ settingsUrl }
						target="_blank"
						rel="noopener noreferrer"
						__next40pxDefaultSize={ true }
					>
						{ __( 'Add Akismet key', 'jetpack-forms' ) }
					</Button>
				</div>
			);
		}

		return (
			<div>
				<p>
					{ createInterpolateElement(
						__( 'Your forms are protected from spam with <a>Akismet</a>!', 'jetpack-forms' ),
						{
							a: <ExternalLink href={ getRedirectUrl( 'akismet-jetpack-forms-docs' ) } />,
						}
					) }
				</p>
				<div style={ { display: 'flex', gap: '8px', justifyContent: 'flex-start' } }>
					<Button
						variant="primary"
						href={ formSubmissionsUrl }
						target="_blank"
						rel="noopener noreferrer"
						__next40pxDefaultSize={ true }
					>
						{ __( 'View spam', 'jetpack-forms' ) }
					</Button>
					<Button
						variant="primary"
						href={ settingsUrl }
						target="_blank"
						rel="noopener noreferrer"
						__next40pxDefaultSize={ true }
					>
						{ __( 'View stats', 'jetpack-forms' ) }
					</Button>
				</div>
			</div>
		);
	};

	return (
		<IntegrationCard
			title={ __( 'Akismet Spam Protection', 'jetpack-forms' ) }
			description={ __( 'Akismet filters out form spam with 99% accuracy', 'jetpack-forms' ) }
			icon="shield"
			isExpanded={ isExpanded }
			onToggle={ onToggle }
		>
			{ renderContent() }
		</IntegrationCard>
	);
};

export default AkismetCard;
