import { createBlock } from '@wordpress/blocks';
import { ExternalLink, Spinner, ToggleControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import IntegrationCard from './integration-card';
import PluginActionButton from './plugin-action-button';

const CreativeMailCard = ( { isExpanded, onToggle, data, refreshStatus } ) => {
	const { isInstalled = false, isActive = false, settingsUrl = '' } = data || {};

	const selectedBlock = useSelect( select => select( 'core/block-editor' ).getSelectedBlock(), [] );

	const { insertBlock, removeBlock } = useDispatch( 'core/block-editor' );

	const hasEmailBlock = selectedBlock?.innerBlocks?.some(
		( { name } ) => name === 'jetpack/field-email'
	);

	const consentBlock = selectedBlock?.innerBlocks?.find(
		( { name } ) => name === 'jetpack/field-consent'
	);

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

	const renderContent = () => {
		if ( ! data ) {
			return <Spinner />;
		}

		if ( ! isInstalled ) {
			return (
				<div>
					<p>
						<em style={ { color: 'rgba(38, 46, 57, 0.7)' } }>
							{ __(
								'To start sending email campaigns, install the Creative Mail plugin for WordPress.',
								'jetpack-forms'
							) }
						</em>
					</p>
					<PluginActionButton
						pluginSlug="creative-mail-by-constant-contact"
						pluginFile="creative-mail-by-constant-contact/creative-mail-plugin"
						isInstalled={ isInstalled }
						refreshStatus={ refreshStatus }
						trackEventName="jetpack_forms_upsell_creative_mail_click"
					/>
				</div>
			);
		}

		if ( ! isActive ) {
			return (
				<div>
					<p>
						<em>
							{ __(
								'To start sending email campaigns, activate the Creative Mail plugin for WordPress.',
								'jetpack-forms'
							) }
						</em>
					</p>
					<PluginActionButton
						pluginSlug="creative-mail-by-constant-contact"
						pluginFile="creative-mail-by-constant-contact/creative-mail-plugin"
						isInstalled={ isInstalled }
						refreshStatus={ refreshStatus }
						trackEventName="jetpack_forms_upsell_creative_mail_click"
					/>
				</div>
			);
		}

		return (
			<div>
				<p>
					<em>
						{ __( "You're all setup for email marketing with Creative Mail.", 'jetpack-forms' ) }
						<br />
						<ExternalLink href={ settingsUrl }>
							{ __( 'Open Creative Mail settings', 'jetpack-forms' ) }
						</ExternalLink>
					</em>
				</p>
				{ hasEmailBlock && (
					<ToggleControl
						label={ __( 'Add email permission request before submit button', 'jetpack-forms' ) }
						checked={ !! consentBlock }
						onChange={ toggleConsent }
					/>
				) }
			</div>
		);
	};

	return (
		<IntegrationCard
			title={ __( 'Creative Mail', 'jetpack-forms' ) }
			description={ __( 'Manage email contacts and campaigns', 'jetpack-forms' ) }
			icon="email"
			isExpanded={ isExpanded }
			onToggle={ onToggle }
		>
			{ renderContent() }
		</IntegrationCard>
	);
};

export default CreativeMailCard;
