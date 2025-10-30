import {
	Button,
	ExternalLink,
	SelectControl,
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import MailPoetIcon from '../../../../../icons/mailpoet';
import ConsentToggle from '../components/consent-toggle';
import type { CardItem, CardBuilderProps } from './types';
import type { Integration } from '../../../../../types';

type MailPoetList = { id: string; name: string };

export function buildMailPoetCard( {
	integration,
	refreshIntegrations,
	context,
	attributes,
	setAttributes,
}: CardBuilderProps ): CardItem {
	const {
		isConnected = false,
		settingsUrl = '',
		marketingUrl = '',
	} = integration || ( {} as Integration );
	const lists = Array.isArray( integration.details?.lists )
		? ( integration.details?.lists as MailPoetList[] )
		: [];

	const enabledForForm = !! attributes?.mailpoet?.enabledForForm;
	const selectedListId = attributes?.mailpoet?.listId ?? '';

	const base: CardItem = {
		id: integration.id,
		title: integration.title,
		description: integration.subtitle,
		icon: <MailPoetIcon width={ 28 } height={ 28 } />,
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
						mailpoet: {
							...( attributes?.mailpoet ?? {} ),
							enabledForForm: value,
						},
					} ),
			} ),
			notInstalledMessage: createInterpolateElement(
				__(
					'Add powerful email marketing to your forms with <a>MailPoet</a>. Simply install the plugin to start sending emails.',
					'jetpack-forms'
				),
				{ a: <ExternalLink href={ marketingUrl } /> }
			),
			notActivatedMessage: __(
				'MailPoet is installed. Just activate the plugin to start sending emails.',
				'jetpack-forms'
			),
			trackEventName: 'jetpack_forms_upsell_mailpoet_click',
		},
		toggleTooltip: __( 'Grow your audience with MailPoet', 'jetpack-forms' ),
		body: ! isConnected ? (
			<div>
				<p className="integration-card__description">
					{ createInterpolateElement(
						__(
							'MailPoet is active. There is one step left. Please complete <a>MailPoet setup</a>.',
							'jetpack-forms'
						),
						{ a: <ExternalLink href={ settingsUrl } /> }
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
						{ __( 'Complete MailPoet setup', 'jetpack-forms' ) }
					</Button>
					<Button variant="tertiary" onClick={ refreshIntegrations } __next40pxDefaultSize={ true }>
						{ __( 'Refresh status', 'jetpack-forms' ) }
					</Button>
				</HStack>
			</div>
		) : (
			<div>
				{ context === 'block-editor' &&
					( lists.length ? (
						<SelectControl
							label={ __( 'Which MailPoet list should contacts be added to?', 'jetpack-forms' ) }
							value={ selectedListId }
							options={ lists.map( list => ( { label: list.name, value: list.id } ) ) }
							onChange={ ( newId: string ) =>
								setAttributes?.( {
									mailpoet: {
										...( attributes?.mailpoet ?? {} ),
										listId: newId,
									},
								} )
							}
							__next40pxDefaultSize={ true }
							__nextHasNoMarginBottom={ true }
						/>
					) : (
						<p className="integration-card__description">
							{ __(
								'You do not have any MailPoet lists yet. Click the dashboard button below to create one, or contacts will be added to a "Jetpack Forms Subscribers" list.',
								'jetpack-forms'
							) }
						</p>
					) ) }
				{ context === 'block-editor' && <ConsentToggle /> }
				<p className="integration-card__description">
					<ExternalLink href={ settingsUrl }>
						{ __( 'View MailPoet dashboard', 'jetpack-forms' ) }
					</ExternalLink>
				</p>
			</div>
		),
	};

	return base;
}
