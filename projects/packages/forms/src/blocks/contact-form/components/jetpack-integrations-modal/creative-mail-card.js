import { Button, ExternalLink, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useIntegrationStatus, usePluginInstallation } from '../hooks';
import ConsentBlockSettings from '../jetpack-newsletter-integration-settings-consent-block';
import IntegrationCard from './integration-card';

const CreativeMailCard = ( { isExpanded, onToggle } ) => {
	const { isCheckingStatus, isInstalled, isActive, settingsUrl, refreshStatus } =
		useIntegrationStatus( 'creative-mail' );

	const { isInstalling, installPlugin } = usePluginInstallation(
		'creative-mail-by-constant-contact',
		'creative-mail-by-constant-contact/creative-mail-plugin.php',
		isInstalled,
		'jetpack_forms_upsell_creative_mail_click'
	);

	const handleInstallAction = async () => {
		const success = await installPlugin();
		if ( success ) {
			refreshStatus();
		}
	};

	const renderContent = () => {
		if ( isCheckingStatus ) {
			return <Spinner />;
		}

		if ( ! isInstalled ) {
			return (
				<p>
					<em style={ { color: 'rgba(38, 46, 57, 0.7)' } }>
						{ __(
							'To start sending email campaigns, install the Creative Mail plugin for WordPress.',
							'jetpack-forms'
						) }
						<br />
						<Button variant="secondary" onClick={ handleInstallAction } disabled={ isInstalling }>
							{ isInstalling
								? __( 'Installing…', 'jetpack-forms' )
								: __( 'Install Creative Mail plugin', 'jetpack-forms' ) }
						</Button>
					</em>
				</p>
			);
		}

		if ( ! isActive ) {
			return (
				<p>
					<em>
						{ __(
							'To start sending email campaigns, activate the Creative Mail plugin for WordPress.',
							'jetpack-forms'
						) }
						<br />
						<Button variant="secondary" onClick={ handleInstallAction } disabled={ isInstalling }>
							{ isInstalling
								? __( 'Activating…', 'jetpack-forms' )
								: __( 'Activate Creative Mail Plugin', 'jetpack-forms' ) }
						</Button>
					</em>
				</p>
			);
		}

		return (
			<>
				<p>
					<em>
						{ __( "You're all setup for email marketing with Creative Mail.", 'jetpack-forms' ) }
						<br />
						<ExternalLink href={ settingsUrl }>
							{ __( 'Open Creative Mail settings', 'jetpack-forms' ) }
						</ExternalLink>
					</em>
				</p>
				<ConsentBlockSettings />
			</>
		);
	};

	return (
		<IntegrationCard
			title={ __( 'Creative Mail', 'jetpack-forms' ) }
			description={ __( 'Manage email contacts and campaigns', 'jetpack-forms' ) }
			icon="email"
			isExpanded={ isExpanded }
			onToggle={ onToggle }
		>
			{ renderContent() }
		</IntegrationCard>
	);
};

export default CreativeMailCard;
