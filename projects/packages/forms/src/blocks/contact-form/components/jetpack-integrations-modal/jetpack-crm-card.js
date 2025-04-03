import colorStudio from '@automattic/color-studio';
import { JetpackIcon } from '@automattic/jetpack-components';
import { Button, Spinner, ToggleControl } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import semver from 'semver';
import IntegrationCard from './integration-card';
import PluginActionButton from './plugin-action-button';

const COLOR_JETPACK = colorStudio.colors[ 'Jetpack Green 40' ];

const JetpackCRMCard = ( {
	isExpanded,
	onToggle,
	jetpackCRM,
	setAttributes,
	data,
	refreshStatus,
} ) => {
	const {
		isInstalled = false,
		isActive = false,
		settingsUrl = '',
		version = '',
		details = {},
	} = data || {};

	const { hasExtension = false, canActivateExtension = false } = details;

	const crmVersion = semver.coerce( version );
	const isRecentVersion = crmVersion && semver.gte( crmVersion, '4.9.1' );

	const renderContent = () => {
		if ( ! data ) {
			return <Spinner />;
		}

		// Jetpack CRM not installed
		if ( ! isInstalled ) {
			return (
				<div>
					<p>
						{ __(
							'You can save contacts from Jetpack contact forms in Jetpack CRM.',
							'jetpack-forms'
						) }
					</p>
					<PluginActionButton
						pluginSlug="zero-bs-crm"
						pluginFile="zero-bs-crm/ZeroBSCRM"
						isInstalled={ isInstalled }
						refreshStatus={ refreshStatus }
						trackEventName="jetpack_forms_upsell_crm_click"
					/>
				</div>
			);
		}

		// Jetpack CRM installed but not active
		if ( ! isActive ) {
			return (
				<div>
					<p>
						{ __(
							"You already have the Jetpack CRM plugin installed, but it's not activated.",
							'jetpack-forms'
						) }
					</p>
					<PluginActionButton
						pluginSlug="zero-bs-crm"
						pluginFile="zero-bs-crm/ZeroBSCRM"
						isInstalled={ isInstalled }
						refreshStatus={ refreshStatus }
						trackEventName="jetpack_forms_upsell_crm_click"
					/>
				</div>
			);
		}

		// Jetpack CRM installed and active, but not recent version
		if ( ! isRecentVersion ) {
			return (
				<div>
					<p>
						{ __(
							'Please update to the latest version of the Jetpack CRM plugin to integrate your contact form with your CRM.',
							'jetpack-forms'
						) }
					</p>
					<Button variant="primary" href={ settingsUrl } __next40pxDefaultSize={ true }>
						{ __( 'Update CRM', 'jetpack-forms' ) }
					</Button>
				</div>
			);
		}

		// Jetpack CRM installed, active, and recent, but no extension
		if ( ! hasExtension ) {
			return (
				<div>
					<p>
						{ createInterpolateElement(
							__(
								"You can integrate this contact form with Jetpack CRM by enabling Jetpack CRM's <a>Jetpack Forms extension</a>.",
								'jetpack-forms'
							),
							{
								a: <Button variant="link" href={ settingsUrl } />,
							}
						) }
					</p>
					{ ! canActivateExtension && (
						<p>
							{ __(
								'A site administrator must enable the CRM Jetpack Forms extension.',
								'jetpack-forms'
							) }
						</p>
					) }
					{ canActivateExtension && (
						<Button variant="primary" href={ settingsUrl } __next40pxDefaultSize={ true }>
							{ __( 'Enable Jetpack Forms Extension', 'jetpack-forms' ) }
						</Button>
					) }
				</div>
			);
		}

		// All conditions met - show toggle and link to CRM settings
		return (
			<div>
				<ToggleControl
					className="jetpack-contact-form__crm_toggle"
					label={ __( 'Jetpack CRM', 'jetpack-forms' ) }
					checked={ jetpackCRM }
					onChange={ value => setAttributes( { jetpackCRM: value } ) }
					help={ __( 'Store contact form submissions in your CRM.', 'jetpack-forms' ) }
				/>
				<Button variant="link" href={ settingsUrl } target="_blank" rel="noopener noreferrer">
					{ __( 'Open CRM Settings', 'jetpack-forms' ) }
				</Button>
			</div>
		);
	};

	return (
		<IntegrationCard
			title={ __( 'Jetpack CRM', 'jetpack-forms' ) }
			description={ __( 'Keep on top of leads as they are added to your CRM', 'jetpack-forms' ) }
			icon={ <JetpackIcon color={ COLOR_JETPACK } /> }
			isExpanded={ isExpanded }
			onToggle={ onToggle }
		>
			{ renderContent() }
		</IntegrationCard>
	);
};

export default JetpackCRMCard;
