import { Button, ExternalLink, __experimentalHStack as HStack } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import IntegrationCard from '../../blocks/contact-form/components/jetpack-integrations-modal/integration-card';
import HostingerReachIcon from '../../icons/hostinger-reach';
import type { SingleIntegrationCardProps, IntegrationCardData } from '../../types';

const HostingerReachDashboardCard = ( {
	isExpanded,
	onToggle,
	data,
	refreshStatus,
}: SingleIntegrationCardProps ) => {
	const { isConnected = false, settingsUrl = '', marketingUrl = '' } = data || {};

	const cardData: IntegrationCardData = {
		...data,
		showHeaderToggle: false,
		isLoading: ! data || typeof data.isInstalled === 'undefined',
		refreshStatus,
		trackEventName: 'jetpack_forms_upsell_hostinger_reach_click',
		notInstalledMessage: createInterpolateElement(
			__(
				'Add powerful email marketing to your forms with <a>Hostinger Reach</a>. Simply install the plugin to start sending emails.',
				'jetpack-forms'
			),
			{
				a: <ExternalLink href={ marketingUrl } />,
			}
		),
		notActivatedMessage: __(
			'Hostinger Reach is installed. Just activate the plugin to start sending emails.',
			'jetpack-forms'
		),
	};

	return (
		<IntegrationCard
			title={ data?.title }
			description={ data?.subtitle }
			icon={ <HostingerReachIcon width={ 28 } height={ 28 } /> }
			isExpanded={ isExpanded }
			onToggle={ onToggle }
			cardData={ cardData }
			toggleTooltip={ __( 'Grow your audience with Hostinger Reach', 'jetpack-forms' ) }
		>
			{ ! isConnected ? (
				<div>
					<p className="integration-card__description">
						{ createInterpolateElement(
							__(
								'Hostinger Reach is active. There is one step left. Please complete <a>Hostinger Reach setup</a>.',
								'jetpack-forms'
							),
							{
								a: <ExternalLink href={ settingsUrl } />,
							}
						) }
					</p>
					<HStack spacing="3" justify="start">
						<Button
							variant="secondary"
							href={ settingsUrl }
							target="_blank"
							rel="noopener noreferrer"
							__next40pxDefaultSize={ true }
						>
							{ __( 'Complete Hostinger Reach setup', 'jetpack-forms' ) }
						</Button>
						<Button variant="tertiary" onClick={ refreshStatus } __next40pxDefaultSize={ true }>
							{ __( 'Refresh status', 'jetpack-forms' ) }
						</Button>
					</HStack>
				</div>
			) : (
				<div>
					<p className="integration-card__description">
						{ __( 'You can now send marketing emails with Hostinger Reach.', 'jetpack-forms' ) }
					</p>
					<Button variant="link" href={ settingsUrl } target="_blank" rel="noopener noreferrer">
						{ __( 'View Hostinger Reach dashboard', 'jetpack-forms' ) }
					</Button>
				</div>
			) }
		</IntegrationCard>
	);
};

export default HostingerReachDashboardCard;
