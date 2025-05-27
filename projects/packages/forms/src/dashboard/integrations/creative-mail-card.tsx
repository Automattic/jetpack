import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import IntegrationCard from '../../blocks/contact-form/components/jetpack-integrations-modal/integration-card';
import CreativeMailIcon from '../../icons/creative-mail';
import type { IntegrationCardProps } from './types';

const CreativeMailDashboardCard = ( {
	isExpanded,
	onToggle,
	data,
	refreshStatus,
	borderBottom = true,
}: IntegrationCardProps & { borderBottom?: boolean } ) => {
	const { settingsUrl = '' } = data || {};

	const cardData = {
		...data,
		showHeaderToggle: false, // Always off for dashboard
		isLoading: ! data || typeof data.isInstalled === 'undefined',
		refreshStatus,
		trackEventName: 'jetpack_forms_upsell_creative_mail_click',
		notInstalledMessage: __(
			'To start sending email campaigns, install the Creative Mail plugin.',
			'jetpack-forms'
		),
		notActivatedMessage: __(
			'Creative Mail is installed. To start sending email campaigns, simply activate the plugin.',
			'jetpack-forms'
		),
	};

	return (
		<IntegrationCard
			title={ __( 'Creative Mail', 'jetpack-forms' ) }
			description={ __( 'Manage email contacts and campaigns', 'jetpack-forms' ) }
			// @ts-expect-error: IntegrationCard icon prop accepts JSX.Element
			icon={ <CreativeMailIcon /> }
			isExpanded={ isExpanded }
			onToggle={ onToggle }
			cardData={ cardData }
			borderBottom={ borderBottom }
		>
			<div>
				<p className="integration-card__description">
					{ __( "You're all setup for email marketing with Creative Mail.", 'jetpack-forms' ) }
				</p>
				<Button
					variant="link"
					href={ settingsUrl }
					target="_blank"
					rel="noopener noreferrer"
					className="jetpack-forms-creative-mail-settings-button"
				>
					{ __( 'Open Creative Mail settings', 'jetpack-forms' ) }
				</Button>
			</div>
		</IntegrationCard>
	);
};

export default CreativeMailDashboardCard;
