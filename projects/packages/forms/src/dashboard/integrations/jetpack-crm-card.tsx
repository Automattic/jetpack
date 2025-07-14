/**
 * External dependencies
 */
import colorStudio from '@automattic/color-studio';
import { JetpackIcon } from '@automattic/jetpack-components';
import { Button, ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import semver from 'semver';
/**
 * Internal dependencies
 */
import IntegrationCard from '../../blocks/contact-form/components/jetpack-integrations-modal/integration-card';
/**
 * Types
 */
import type { SingleIntegrationCardProps, IntegrationCardData } from '../../types';

const COLOR_JETPACK = colorStudio.colors[ 'Jetpack Green 40' ];

const JetpackCRMDashboardCard = ( {
	isExpanded,
	onToggle,
	data,
	refreshStatus,
}: SingleIntegrationCardProps ) => {
	const { settingsUrl = '', marketingUrl = '', version = '', details = {} } = data || {};
	const { hasExtension = false, canActivateExtension = false } = details;

	const crmVersion = semver.coerce( version );
	const isRecentVersion = crmVersion && semver.gte( crmVersion, '4.9.1' );

	const cardData: IntegrationCardData = {
		...data,
		showHeaderToggle: false, // Always off for dashboard
		isLoading: ! data || typeof data.isInstalled === 'undefined',
		refreshStatus,
		trackEventName: 'jetpack_forms_upsell_crm_click',
		notInstalledMessage: createInterpolateElement(
			__(
				'You can save your form contacts in <a>Jetpack CRM</a>. To get started, please install the plugin.',
				'jetpack-forms'
			),
			{
				a: <ExternalLink href={ marketingUrl } />,
			}
		),
		notActivatedMessage: __(
			'Jetpack CRM is installed. To start saving contacts, simply activate the plugin.',
			'jetpack-forms'
		),
	};

	const renderContent = () => {
		// Jetpack CRM installed and active, but not recent version
		if ( ! isRecentVersion ) {
			return (
				<div>
					<p className="integration-card__description">
						{ __(
							'Please update to the latest version of the Jetpack CRM plugin to integrate your contact form with your CRM.',
							'jetpack-forms'
						) }
					</p>
					<Button
						variant="secondary"
						href={ settingsUrl }
						target="_blank"
						rel="noopener noreferrer"
						__next40pxDefaultSize={ true }
					>
						{ __( 'Update Jetpack CRM', 'jetpack-forms' ) }
					</Button>
				</div>
			);
		}

		// Jetpack CRM installed, active, and recent, but no extension
		if ( ! hasExtension ) {
			return (
				<div>
					<p className="integration-card__description">
						{ createInterpolateElement(
							__(
								"You can integrate Jetpack CRM by enabling Jetpack CRM's <a>Jetpack Forms extension</a>.",
								'jetpack-forms'
							),
							{
								a: (
									<Button
										variant="link"
										href={ settingsUrl }
										target="_blank"
										rel="noopener noreferrer"
									/>
								),
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
						<Button
							variant="secondary"
							href={ settingsUrl }
							target="_blank"
							rel="noopener noreferrer"
							__next40pxDefaultSize={ true }
						>
							{ __( 'Enable Jetpack Forms extension', 'jetpack-forms' ) }
						</Button>
					) }
				</div>
			);
		}

		// All conditions met, show Jetpack CRM connected message
		return (
			<div>
				<p>{ __( 'Jetpack CRM is connected.', 'jetpack-forms' ) }</p>
				<Button variant="link" href={ settingsUrl } target="_blank" rel="noopener noreferrer">
					{ __( 'Open Jetpack CRM settings', 'jetpack-forms' ) }
				</Button>
			</div>
		);
	};

	return (
		<IntegrationCard
			title={ __( 'Jetpack CRM', 'jetpack-forms' ) }
			description={ __( 'Store contact form submissions in your CRM', 'jetpack-forms' ) }
			icon={ <JetpackIcon color={ COLOR_JETPACK } /> }
			isExpanded={ isExpanded }
			onToggle={ onToggle }
			cardData={ cardData }
		>
			{ renderContent() }
		</IntegrationCard>
	);
};

export default JetpackCRMDashboardCard;
