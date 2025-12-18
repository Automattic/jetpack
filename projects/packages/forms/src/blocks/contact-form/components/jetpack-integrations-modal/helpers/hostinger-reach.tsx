import {
	Button,
	ExternalLink,
	TextControl,
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import HostingerReachIcon from '../../../../../icons/hostinger-reach.tsx';
import ConsentToggle from '../components/consent-toggle.tsx';
import type { CardItem, CardBuilderProps } from './types.ts';
import type { Integration } from '../../../../../types/index.ts';

export function buildHostingerReachCard( {
	integration,
	refreshIntegrations,
	context,
	attributes,
	setAttributes,
}: CardBuilderProps ): CardItem {
	const { isConnected = false, settingsUrl = '' } = integration || ( {} as Integration );
	const enabledForForm = !! attributes?.hostingerReach?.enabledForForm;
	const groupName = attributes?.hostingerReach?.groupName ?? '';

	const base: CardItem = {
		id: integration.id,
		title: integration.title,
		description: integration.subtitle,
		icon: <HostingerReachIcon width={ 28 } height={ 28 } />,
		cardData: {
			...integration,
			isLoading: typeof integration.isInstalled === 'undefined',
			refreshStatus: refreshIntegrations,
			showHeaderToggle: context === 'block-editor',
			...( context === 'block-editor' && {
				headerToggleValue: enabledForForm,
				isHeaderToggleEnabled: isConnected,
				onHeaderToggleChange: ( value: boolean ) =>
					setAttributes?.( {
						hostingerReach: {
							...( attributes?.hostingerReach ?? {} ),
							enabledForForm: value,
						},
					} ),
			} ),
			notInstalledMessage: createInterpolateElement(
				__(
					'Add powerful email marketing to your forms with <a>Hostinger Reach</a>. Simply install the plugin to start sending emails.',
					'jetpack-forms'
				),
				{ a: <ExternalLink href={ ( integration.marketingUrl as string ) || '' } /> }
			),
			notActivatedMessage: __(
				'Hostinger Reach is installed. Just activate the plugin to start sending emails.',
				'jetpack-forms'
			),
			trackEventName: 'jetpack_forms_upsell_hostinger_reach_click',
		},
		toggleTooltip: __( 'Grow your audience with Hostinger Reach', 'jetpack-forms' ),
		body: ! isConnected ? (
			<>
				<p className="integration-card__description">
					<ExternalLink href={ settingsUrl }>
						{ __(
							'Hostinger Reach is active. There is one step left. Please complete Hostinger Reach setup.',
							'jetpack-forms'
						) }
					</ExternalLink>
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
					<Button variant="tertiary" onClick={ refreshIntegrations } __next40pxDefaultSize={ true }>
						{ __( 'Refresh status', 'jetpack-forms' ) }
					</Button>
				</HStack>
			</>
		) : (
			<>
				{ context === 'block-editor' && (
					<div className="integration-card__section">
						<TextControl
							label={ __( 'Group name (optional)', 'jetpack-forms' ) }
							help={ __(
								'If empty, contacts will be added under "Jetpack Forms".',
								'jetpack-forms'
							) }
							value={ groupName }
							onChange={ ( newName: string ) =>
								setAttributes?.( {
									hostingerReach: {
										...( attributes?.hostingerReach ?? {} ),
										groupName: newName,
									},
								} )
							}
							__nextHasNoMarginBottom
						/>
					</div>
				) }
				{ context === 'block-editor' && <ConsentToggle /> }
				<p className="integration-card__description">
					<ExternalLink href={ settingsUrl }>
						{ __( 'View Hostinger Reach dashboard', 'jetpack-forms' ) }
					</ExternalLink>
				</p>
			</>
		),
	};

	return base;
}
