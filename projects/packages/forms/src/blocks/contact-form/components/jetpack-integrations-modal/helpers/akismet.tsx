import { getRedirectUrl } from '@automattic/jetpack-components';
import { Button, ExternalLink, __experimentalHStack as HStack } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import AkismetIcon from '../../../../../icons/akismet';
import type { CardItem, CardBuilderProps } from './types';

type AkismetDetails = {
	formSubmissionsSpamUrl?: string;
};

export function buildAkismetCard( {
	integration,
	refreshIntegrations,
	context,
	handlers,
}: CardBuilderProps ): CardItem {
	const isConnected = !! integration.isConnected;
	const settingsUrl = ( integration.settingsUrl as string ) || '';
	const marketingUrl = ( integration.marketingUrl as string ) || '';
	const details = ( integration.details || {} ) as AkismetDetails;
	const spamUrl = details.formSubmissionsSpamUrl || '';

	const base: CardItem = {
		id: integration.id,
		title: integration.title,
		description: integration.subtitle,
		icon: <AkismetIcon width={ 28 } height={ 28 } />,
		cardData: {
			...integration,
			isLoading: typeof integration.isInstalled === 'undefined',
			refreshStatus: refreshIntegrations,
			showHeaderToggle: context === 'block-editor',
			headerToggleValue: isConnected,
			isHeaderToggleEnabled: false,
			notInstalledMessage: createInterpolateElement(
				__(
					"Add one-click spam protection for your forms with <a>Akismet</a>. Simply install the plugin and you're set.",
					'jetpack-forms'
				),
				{ a: <ExternalLink href={ marketingUrl } /> }
			),
			notActivatedMessage: __(
				'Akismet is installed. Just activate the plugin to start blocking spam.',
				'jetpack-forms'
			),
			trackEventName: 'jetpack_forms_upsell_akismet_click',
		},
		toggleTooltip: __( 'We keep your forms protected', 'jetpack-forms' ),
		body: ! isConnected ? (
			<div>
				<p className="integration-card__description">
					{ createInterpolateElement(
						__(
							'Akismet is active. There is one step left. Please add your <a>Akismet key</a>.',
							'jetpack-forms'
						),
						{ a: <ExternalLink href={ settingsUrl } /> }
					) }
				</p>
				<Button
					variant="secondary"
					href={ settingsUrl }
					target="_blank"
					rel="noopener noreferrer"
					__next40pxDefaultSize={ true }
				>
					{ __( 'Add Akismet key', 'jetpack-forms' ) }
				</Button>
			</div>
		) : (
			<div>
				<p className="integration-card__description">
					{ __( 'Your forms are automatically protected with Akismet.', 'jetpack-forms' ) }
				</p>
				<HStack spacing="2" justify="start" className="integration-card__links">
					{ context === 'dashboard' && handlers?.goToSpam ? (
						<Button variant="link" onClick={ handlers.goToSpam }>
							{ __( 'View spam', 'jetpack-forms' ) }
						</Button>
					) : (
						<Button variant="link" href={ spamUrl } target="_blank" rel="noopener noreferrer">
							{ __( 'View spam', 'jetpack-forms' ) }
						</Button>
					) }
					<span>|</span>
					<Button variant="link" href={ settingsUrl } target="_blank" rel="noopener noreferrer">
						{ __( 'View stats and settings', 'jetpack-forms' ) }
					</Button>
					<span>|</span>
					<ExternalLink href={ getRedirectUrl( 'akismet-jetpack-forms-docs' ) }>
						{ __( 'Learn about Akismet', 'jetpack-forms' ) }
					</ExternalLink>
				</HStack>
			</div>
		),
	};

	return base;
}
