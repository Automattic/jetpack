import {
	Button,
	ExternalLink,
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	SelectControl,
} from '@wordpress/components';
import { createInterpolateElement, useEffect, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import MailPoetIcon from '../../../../icons/mailpoet';
import IntegrationCard from './integration-card';
import type { SingleIntegrationCardProps, IntegrationCardData } from '../../../../types';

interface MailPoetCardProps extends SingleIntegrationCardProps {
	mailpoet: {
		enabledForForm: boolean;
		listId?: string | null;
		listName?: string | null;
	};
	setAttributes: ( attrs: {
		mailpoet: { enabledForForm: boolean; listId?: string | null; listName?: string | null };
	} ) => void;
}

type MailPoetList = { id: string; name: string };

const MailPoetCard = ( {
	isExpanded,
	onToggle,
	mailpoet,
	setAttributes,
	data,
	refreshStatus,
}: MailPoetCardProps ) => {
	const {
		isConnected: mailpoetActiveWithKey = false,
		settingsUrl = '',
		marketingUrl = '',
	} = data || {};

	const mailpoetLists: MailPoetList[] = useMemo(
		() => ( Array.isArray( data?.details?.lists ) ? ( data.details.lists as MailPoetList[] ) : [] ),
		[ data?.details?.lists ]
	);

	useEffect( () => {
		if ( ! mailpoet.enabledForForm ) {
			return;
		}

		// If there are no lists, clear the selection
		if ( mailpoetLists.length === 0 ) {
			if ( mailpoet.listId || mailpoet.listName ) {
				setAttributes( {
					mailpoet: {
						...mailpoet,
						listId: null,
						listName: null,
					},
				} );
			}
			return;
		}

		// If no list is selected, or the selected list no longer exists, set to the first available
		const listIsValid =
			mailpoet.listId && mailpoetLists.some( list => list.id === mailpoet.listId );
		if ( ! listIsValid ) {
			setAttributes( {
				mailpoet: {
					...mailpoet,
					listId: mailpoetLists[ 0 ].id,
					listName: mailpoetLists[ 0 ].name,
				},
			} );
		}
	}, [ mailpoet, mailpoetLists, setAttributes ] );

	const cardData: IntegrationCardData = {
		...data,
		showHeaderToggle: true,
		headerToggleValue: mailpoet?.enabledForForm ?? false,
		isHeaderToggleEnabled: true,
		onHeaderToggleChange: ( value: boolean ) =>
			setAttributes( { mailpoet: { ...mailpoet, enabledForForm: value } } ),
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
			title={ __( 'MailPoet email marketing', 'jetpack-forms' ) }
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
					{ mailpoetLists?.length ? (
						<p className="integration-card__description">
							<SelectControl
								label={ __( 'Which MailPoet list should contacts be added to?', 'jetpack-forms' ) }
								value={ mailpoet.listId }
								options={ mailpoetLists.map( list => ( { label: list.name, value: list.id } ) ) }
								onChange={ value => {
									const selected = mailpoetLists.find( l => l.id === value );
									setAttributes( {
										mailpoet: {
											...mailpoet,
											listId: selected?.id ?? null,
											listName: selected?.name ?? null,
										},
									} );
								} }
								__next40pxDefaultSize={ true }
								__nextHasNoMarginBottom={ true }
							/>
						</p>
					) : (
						<p className="integration-card__description">
							{ __(
								'You do not have any MailPoet lists yet. Click the dashboard button below to create one, or contacts will be added to a "Jetpack Forms Subscribers" list.',
								'jetpack-forms'
							) }
						</p>
					) }
					<p className="integration-card__description">
						<ExternalLink href={ settingsUrl }>
							{ __( 'View MailPoet dashboard', 'jetpack-forms' ) }
						</ExternalLink>
					</p>
				</div>
			) }
		</IntegrationCard>
	);
};

export default MailPoetCard;
