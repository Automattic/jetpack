import { Button, ExternalLink, __experimentalHStack as HStack } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import MailPoetIcon from '../../../../icons/mailpoet';
import IntegrationCard from './integration-card';
import type { SingleIntegrationCardProps, IntegrationCardData } from '../../../../types';

interface MailPoetCardProps extends SingleIntegrationCardProps {
	connectMailPoet: boolean;
	setAttributes: ( attrs: { connectMailPoet: boolean } ) => void;
}

const MailPoetCard = ( {
	isExpanded,
	onToggle,
	connectMailPoet,
	setAttributes,
	data,
	refreshStatus,
}: MailPoetCardProps ) => {
	const {
		isConnected: mailpoetActiveWithKey = false,
		settingsUrl = '',
		marketingUrl = '',
	} = data || {};

	const cardData: IntegrationCardData = {
		...data,
		showHeaderToggle: true,
		headerToggleValue: connectMailPoet ?? false,
		isHeaderToggleEnabled: true,
		onHeaderToggleChange: ( value: boolean ) => setAttributes( { connectMailPoet: value } ),
		isLoading: ! data || typeof data.isInstalled === 'undefined',
		refreshStatus,
		trackEventName: 'jetpack_forms_upsell_mailpoet_click',
		notInstalledMessage: createInterpolateElement(
			__(
				'Add powerful email marketing to your forms with <a>MailPoet</a>. Simply install the plugin to start sending emails.',
				'jetpack-forms'
			),
			{
				a: <ExternalLink href={ marketingUrl } />,
			}
		),
		notActivatedMessage: __(
			'MailPoet is installed. Just activate the plugin to start sending emails.',
			'jetpack-forms'
		),
	};

	return (
		<IntegrationCard
			title={ __( 'MailPoet Email Marketing', 'jetpack-forms' ) }
			description={ __(
				'Send newsletters and marketing emails directly from your site.',
				'jetpack-forms'
			) }
			icon={ <MailPoetIcon width={ 28 } height={ 28 } /> }
			isExpanded={ isExpanded }
			onToggle={ onToggle }
			cardData={ cardData }
			toggleTooltip={ __( 'Grow your audience with MailPoet', 'jetpack-forms' ) }
		>
			{ ! mailpoetActiveWithKey ? (
				<div>
					<p className="integration-card__description">
						{ createInterpolateElement(
							__(
								'MailPoet is active. There is one step left. Please add your <a>MailPoet key</a>.',
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
							{ __( 'Add MailPoet key', 'jetpack-forms' ) }
						</Button>
						<Button variant="tertiary" onClick={ refreshStatus } __next40pxDefaultSize={ true }>
							{ __( 'Refresh status', 'jetpack-forms' ) }
						</Button>
					</HStack>
				</div>
			) : (
				<div>
					<p className="integration-card__description">
						{ __( 'You can now send marketing emails with MailPoet.', 'jetpack-forms' ) }
					</p>
					<Button variant="link" href={ settingsUrl } target="_blank" rel="noopener noreferrer">
						{ __( 'View MailPoet dashboard', 'jetpack-forms' ) }
					</Button>
				</div>
			) }
		</IntegrationCard>
	);
};

export default MailPoetCard;
