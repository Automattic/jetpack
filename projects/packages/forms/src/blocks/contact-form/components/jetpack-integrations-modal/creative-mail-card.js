import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { ToggleControl, Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import IntegrationCard from './integration-card';

const CreativeMailCard = ( { isExpanded, onToggle, data, refreshStatus } ) => {
	const { settingsUrl = '' } = data || {};

	const selectedBlock = useSelect( select => select( blockEditorStore ).getSelectedBlock(), [] );

	const { insertBlock, removeBlock } = useDispatch( blockEditorStore );

	const hasEmailBlock = selectedBlock?.innerBlocks?.some(
		( { name } ) => name === 'jetpack/field-email'
	);

	const consentBlock = selectedBlock?.innerBlocks?.find(
		( { name } ) => name === 'jetpack/field-consent'
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
			'Creative Mail is installed! To start sending email campaigns, simply activate the plugin.',
			'jetpack-forms'
		),
	};

	const toggleConsent = async () => {
		if ( consentBlock ) {
			await removeBlock( consentBlock.clientId, false );
		} else {
			const buttonBlockIndex = selectedBlock.innerBlocks.findIndex(
				( { name } ) => name === 'jetpack/button'
			);
			const newConsentBlock = await createBlock( 'jetpack/field-consent' );
			await insertBlock( newConsentBlock, buttonBlockIndex, selectedBlock.clientId, false );
		}
	};

	return (
		<IntegrationCard
			title={ __( 'Creative Mail', 'jetpack-forms' ) }
			description={ __( 'Manage email contacts and campaigns', 'jetpack-forms' ) }
			icon="email"
			isExpanded={ isExpanded }
			onToggle={ onToggle }
			cardData={ cardData }
		>
			<div>
				<p>{ __( "You're all setup for email marketing with Creative Mail.", 'jetpack-forms' ) }</p>
				{ hasEmailBlock && (
					<ToggleControl
						label={ __( 'Add email permission request before submit button', 'jetpack-forms' ) }
						checked={ !! consentBlock }
						onChange={ toggleConsent }
					/>
				) }
				<Button variant="link" href={ settingsUrl } target="_blank" rel="noopener noreferrer">
					{ __( 'Open Creative Mail settings', 'jetpack-forms' ) }
				</Button>
			</div>
		</IntegrationCard>
	);
};

export default CreativeMailCard;
