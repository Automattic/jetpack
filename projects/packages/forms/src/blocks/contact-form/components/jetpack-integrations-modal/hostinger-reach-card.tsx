import {
	Button,
	ExternalLink,
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	TextControl,
} from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import HostingerReachIcon from '../../../../icons/hostinger-reach';
import ConsentToggle from './consent-toggle';
import IntegrationCard from './integration-card';
import type { SingleIntegrationCardProps, IntegrationCardData } from '../../../../types';

interface HostingerReachCardProps extends SingleIntegrationCardProps {
	hostingerReach: { enabledForForm?: boolean; groupName?: string };
	setAttributes: ( attrs: {
		hostingerReach: { enabledForForm?: boolean; groupName?: string };
	} ) => void;
}

const HostingerReachCard = ( {
	isExpanded,
	onToggle,
	hostingerReach,
	setAttributes,
	data,
	refreshStatus,
}: HostingerReachCardProps ) => {
	const { isConnected = false, settingsUrl = '' } = data || {};

	const cardData: IntegrationCardData = {
		...data,
		showHeaderToggle: true,
		headerToggleValue: !! hostingerReach?.enabledForForm,
		isHeaderToggleEnabled: isConnected,
		onHeaderToggleChange: ( value: boolean ) =>
			setAttributes( { hostingerReach: { ...hostingerReach, enabledForForm: value } } ),
		isLoading: ! data || typeof data.isInstalled === 'undefined',
		refreshStatus,
		trackEventName: 'jetpack_forms_upsell_hostinger_reach_click',
		notInstalledMessage: createInterpolateElement(
			__(
				'Add powerful email marketing to your forms with Hostinger Reach. Simply install the plugin to start sending emails.',
				'jetpack-forms'
			),
			{
				a: <ExternalLink href={ data?.marketingUrl } />,
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
					<div className="integration-card__section">
						<TextControl
							label={ __( 'Group name (optional)', 'jetpack-forms' ) }
							help={ __(
								"If empty, contacts will be added under 'Jetpack Forms'.",
								'jetpack-forms'
							) }
							value={ hostingerReach.groupName ?? '' }
							onChange={ value =>
								setAttributes( {
									hostingerReach: { ...hostingerReach, groupName: value },
								} )
							}
							__nextHasNoMarginBottom
						/>
					</div>
					<ConsentToggle />
					<p className="integration-card__description">
						<ExternalLink href={ settingsUrl }>
							{ __( 'View Hostinger Reach dashboard', 'jetpack-forms' ) }
						</ExternalLink>
					</p>
				</div>
			) }
		</IntegrationCard>
	);
};

export default HostingerReachCard;
