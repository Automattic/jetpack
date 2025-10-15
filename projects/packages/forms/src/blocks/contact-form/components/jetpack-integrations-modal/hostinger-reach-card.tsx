import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import {
	Button,
	ExternalLink,
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	ToggleControl,
	TextControl,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import HostingerReachIcon from '../../../../icons/hostinger-reach';
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

	const selectedBlock = useSelect( select => select( blockEditorStore ).getSelectedBlock(), [] );
	const { insertBlock, removeBlock } = useDispatch( blockEditorStore );
	const hasEmailBlock = selectedBlock?.innerBlocks?.some(
		( { name }: { name: string } ) => name === 'jetpack/field-email'
	);
	const consentBlock = selectedBlock?.innerBlocks?.find(
		( { name }: { name: string } ) => name === 'jetpack/field-consent'
	);

	const toggleConsent = async () => {
		if ( consentBlock ) {
			await removeBlock( consentBlock.clientId, false );
		} else {
			const buttonBlockIndex = selectedBlock.innerBlocks.findIndex(
				( { name }: { name: string } ) => name === 'jetpack/button'
			);
			const newConsentBlock = await createBlock( 'jetpack/field-consent' );
			await insertBlock( newConsentBlock, buttonBlockIndex, selectedBlock.clientId, false );
		}
	};

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
					{ hasEmailBlock && (
						<div className="integration-card__section">
							<ToggleControl
								label={ __( 'Add email permission request before submit button', 'jetpack-forms' ) }
								checked={ !! consentBlock }
								onChange={ toggleConsent }
								__nextHasNoMarginBottom
							/>
						</div>
					) }
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
