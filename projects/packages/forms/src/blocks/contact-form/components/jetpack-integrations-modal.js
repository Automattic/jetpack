import { getRedirectUrl } from '@automattic/jetpack-components';
import {
	Modal,
	Card,
	CardHeader,
	CardBody,
	Button,
	ExternalLink,
	Icon,
} from '@wordpress/components';
import { createInterpolateElement, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import CRMIntegrationSettings from './jetpack-crm-integration/jetpack-crm-integration-settings';
import NewsletterIntegrationSettings from './jetpack-newsletter-integration-settings';
import PluginIntegrationPanel from './shared/plugin-integration-panel';

const JetpackIntegrationsModal = ( { isOpen, onClose, attributes, setAttributes } ) => {
	const [ expandedCards, setExpandedCards ] = useState( {
		akismet: false,
		crm: false,
		creativemail: false,
	} );

	if ( ! isOpen ) {
		return null;
	}

	const toggleCard = cardId => {
		setExpandedCards( prev => ( {
			...prev,
			[ cardId ]: ! prev[ cardId ],
		} ) );
	};

	const adminUrl = window?.jpFormsBlocks?.defaults?.formsAdminUrl || '';
	const akismetActiveWithKey = window?.jpFormsBlocks?.defaults?.akismetActiveWithKey || false;
	const akismetUrl = window?.jpFormsBlocks?.defaults?.akismetUrl || '';

	return (
		<Modal
			title={ __( 'Form Integrations', 'jetpack-forms' ) }
			onRequestClose={ onClose }
			style={ { width: '700px' } }
		>
			<div style={ { padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' } }>
				<Card>
					<CardHeader onClick={ () => toggleCard( 'akismet' ) } style={ { cursor: 'pointer' } }>
						<div style={ { display: 'flex', alignItems: 'center', gap: '8px' } }>
							<Icon icon={ expandedCards.akismet ? 'arrow-down-alt2' : 'arrow-right-alt2' } />
							<strong>{ __( 'Akismet', 'jetpack-forms' ) }</strong>
						</div>
					</CardHeader>
					{ expandedCards.akismet && (
						<CardBody>
							<PluginIntegrationPanel
								title={ __( 'Spam protection', 'jetpack-forms' ) }
								pluginSlug="akismet"
								pluginPath="akismet/akismet"
								pluginTitle="Akismet"
								installText={ __( 'Install Akismet', 'jetpack-forms' ) }
								activateText={ __( 'Activate Akismet', 'jetpack-forms' ) }
								description={ createInterpolateElement(
									__(
										"Add one-click spam protection for your forms with <a>Akismet</a>. Simply install the plugin and you're set.",
										'jetpack-forms'
									),
									{
										a: <ExternalLink href={ getRedirectUrl( 'akismet-wordpress-org' ) } />,
									}
								) }
								tracksEventName="jetpack_forms_upsell_akismet_click"
								hideWrapper
							>
								{ akismetActiveWithKey ? (
									<>
										<p>
											{ createInterpolateElement(
												__(
													'Your forms are protected from spam with <a>Akismet</a>!',
													'jetpack-forms'
												),
												{
													a: (
														<ExternalLink href={ getRedirectUrl( 'akismet-jetpack-forms-docs' ) } />
													),
												}
											) }
										</p>
										<div style={ { display: 'flex', gap: '8px', justifyContent: 'flex-start' } }>
											<Button
												variant="secondary"
												href={ adminUrl }
												target="_blank"
												rel="noopener noreferrer"
												__next40pxDefaultSize={ true }
											>
												{ __( 'View spam', 'jetpack-forms' ) }
											</Button>
											<Button
												variant="secondary"
												href={ akismetUrl }
												target="_blank"
												rel="noopener noreferrer"
												__next40pxDefaultSize={ true }
											>
												{ __( 'View stats', 'jetpack-forms' ) }
											</Button>
										</div>
									</>
								) : (
									<>
										<p>
											{ createInterpolateElement(
												__(
													'Akismet is active! There is one step left. Please add your <a>Akismet key</a>.',
													'jetpack-forms'
												),
												{
													a: <ExternalLink href={ akismetUrl } />,
												}
											) }
										</p>
										<Button
											variant="secondary"
											href={ akismetUrl }
											target="_blank"
											rel="noopener noreferrer"
											__next40pxDefaultSize={ true }
										>
											{ __( 'Add Akismet key', 'jetpack-forms' ) }
										</Button>
									</>
								) }
							</PluginIntegrationPanel>
						</CardBody>
					) }
				</Card>

				<Card>
					<CardHeader onClick={ () => toggleCard( 'crm' ) } style={ { cursor: 'pointer' } }>
						<div style={ { display: 'flex', alignItems: 'center', gap: '8px' } }>
							<Icon icon={ expandedCards.crm ? 'arrow-down-alt2' : 'arrow-right-alt2' } />
							<strong>{ __( 'Jetpack CRM', 'jetpack-forms' ) }</strong>
						</div>
					</CardHeader>
					{ expandedCards.crm && (
						<CardBody>
							<CRMIntegrationSettings
								jetpackCRM={ attributes.jetpackCRM }
								setAttributes={ setAttributes }
							/>
						</CardBody>
					) }
				</Card>

				<Card>
					<CardHeader
						onClick={ () => toggleCard( 'creativemail' ) }
						style={ { cursor: 'pointer' } }
					>
						<div style={ { display: 'flex', alignItems: 'center', gap: '8px' } }>
							<Icon icon={ expandedCards.creativemail ? 'arrow-down-alt2' : 'arrow-right-alt2' } />
							<strong>{ __( 'Creative Mail', 'jetpack-forms' ) }</strong>
						</div>
					</CardHeader>
					{ expandedCards.creativemail && (
						<CardBody>
							<NewsletterIntegrationSettings />
						</CardBody>
					) }
				</Card>
			</div>
		</Modal>
	);
};

export default JetpackIntegrationsModal;
