import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { ToggleControl, Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import CreativeMailIcon from '../../../../icons/creative-mail';
import IntegrationCard from './integration-card';
import type { SingleIntegrationCardProps } from '../../../../types';

const CreativeMailCard = ( {
	isExpanded,
	onToggle,
	data,
	refreshStatus,
	borderBottom = true,
}: SingleIntegrationCardProps ) => {
	const { settingsUrl = '' } = data || {};

	const selectedBlock = useSelect( select => select( blockEditorStore ).getSelectedBlock(), [] );

	const { insertBlock, removeBlock } = useDispatch( blockEditorStore );

	const hasEmailBlock = selectedBlock?.innerBlocks?.some(
		( { name }: { name: string } ) => name === 'jetpack/field-email'
	);

	const consentBlock = selectedBlock?.innerBlocks?.find(
		( { name }: { name: string } ) => name === 'jetpack/field-consent'
	);

	const cardData = {
		...data,
		showHeaderToggle: false,
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

	return (
		<IntegrationCard
			title={ data?.title }
			description={ data?.subtitle }
			icon={ <CreativeMailIcon /> }
			isExpanded={ isExpanded }
			onToggle={ onToggle }
			cardData={ cardData }
			borderBottom={ borderBottom }
		>
			<div>
				<p className="integration-card__description">
					{ __(
						"You're all set up for email marketing with Creative Mail. Please manage your marketing from Creative Mail panel.",
						'jetpack-forms'
					) }
				</p>
				{ hasEmailBlock && (
					<ToggleControl
						label={ __( 'Add email permission request before submit button', 'jetpack-forms' ) }
						checked={ !! consentBlock }
						onChange={ toggleConsent }
						__nextHasNoMarginBottom
					/>
				) }
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

export default CreativeMailCard;
