import colorStudio from '@automattic/color-studio';
import { JetpackIcon } from '@automattic/jetpack-components';
import { Button, ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import semver from 'semver';
import type { CardItem, CardBuilderProps } from './types.ts';

const COLOR_JETPACK = colorStudio.colors[ 'Jetpack Green 40' ];

export function buildJetpackCrmCard( {
	integration,
	refreshIntegrations,
	context,
	attributes,
	setAttributes,
}: CardBuilderProps ): CardItem {
	const { settingsUrl = '', marketingUrl = '', version = '', details = {} } = integration || {};
	const { hasExtension = false, canActivateExtension = false } = details as {
		hasExtension?: boolean;
		canActivateExtension?: boolean;
	};
	const crmVersion = semver.coerce( version as string );
	const isRecentVersion = crmVersion && semver.gte( crmVersion, '4.9.1' );

	const connectedMsgEditor = __( 'This form is connected to Jetpack CRM.', 'jetpack-forms' );
	const connectedMsgDashboard = __( 'Jetpack CRM is connected.', 'jetpack-forms' );

	const renderBody = (): JSX.Element => {
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

		if ( ! hasExtension ) {
			return (
				<div>
					<p className="integration-card__description">
						{ createInterpolateElement(
							__(
								"You can integrate this contact form with Jetpack CRM by enabling Jetpack CRM's <a>Jetpack Forms extension</a>.",
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

		return (
			<div>
				<p className="integration-card__description">
					{ context === 'block-editor' ? connectedMsgEditor : connectedMsgDashboard }
				</p>
				<ExternalLink href={ settingsUrl }>
					{ __( 'Open Jetpack CRM settings', 'jetpack-forms' ) }
				</ExternalLink>
			</div>
		);
	};

	const base: CardItem = {
		id: integration.id,
		title: integration.title,
		description: integration.subtitle,
		icon: <JetpackIcon color={ COLOR_JETPACK } />,
		cardData: {
			...integration,
			isLoading: typeof integration.isInstalled === 'undefined',
			refreshStatus: refreshIntegrations,
			showHeaderToggle: context === 'block-editor',
			...( context === 'block-editor' && {
				headerToggleValue: !! attributes?.jetpackCRM,
				isHeaderToggleEnabled: true,
				onHeaderToggleChange: ( value: boolean ) => {
					setAttributes?.( { jetpackCRM: value } );
				},
			} ),
			trackEventName: 'jetpack_forms_upsell_crm_click',
			notInstalledMessage: createInterpolateElement(
				__(
					'You can save your form contacts in <a>Jetpack CRM</a>. To get started, please install the plugin.',
					'jetpack-forms'
				),
				{ a: <ExternalLink href={ marketingUrl } /> }
			),
			notActivatedMessage: __(
				'Jetpack CRM is installed. To start saving contacts, simply activate the plugin.',
				'jetpack-forms'
			),
		},
		body: renderBody(),
	};

	return base;
}
