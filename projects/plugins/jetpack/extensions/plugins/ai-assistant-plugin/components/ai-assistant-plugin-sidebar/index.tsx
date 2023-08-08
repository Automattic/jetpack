/**
 * External dependencies
 */
import { JetpackEditorPanelLogo } from '@automattic/jetpack-shared-extension-utils';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button, PanelBody, PanelRow } from '@wordpress/components';
import { PluginPrePublishPanel } from '@wordpress/edit-post';
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import useAICheckout from '../../../../blocks/ai-assistant/hooks/use-ai-checkout';
import useAIFeature from '../../../../blocks/ai-assistant/hooks/use-ai-feature';
import JetpackPluginSidebar from '../../../../shared/jetpack-plugin-sidebar';
import Proofread from '../proofread';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Upgrade = ( { onClick }: { onClick: ( event: any ) => void } ) => {
	const { tracks } = useAnalytics();

	const handleClick = useCallback(
		evt => {
			tracks.recordEvent( 'jetpack_ai_get_feedback_upgrade_click' );
			onClick?.( evt );
		},
		[ onClick, tracks ]
	);

	return (
		<div>
			{ createInterpolateElement(
				__(
					'You have reached the limit of 20 free requests. <button>Upgrade to continue generating feedback.</button>',
					'jetpack'
				),
				{
					button: <Button variant="link" onClick={ handleClick } />,
				}
			) }
		</div>
	);
};

export default function AiAssistantPluginSidebar() {
	const { requireUpgrade } = useAIFeature();
	const { autosaveAndRedirect, isRedirecting } = useAICheckout();

	const title = __( 'AI Assistant', 'jetpack' );

	return (
		<>
			<JetpackPluginSidebar>
				<PanelBody title={ title } initialOpen={ false }>
					<PanelRow>
						<Proofread busy={ isRedirecting } disabled={ requireUpgrade } />
					</PanelRow>
					{ requireUpgrade && (
						<PanelRow>
							<Upgrade onClick={ autosaveAndRedirect } />
						</PanelRow>
					) }
				</PanelBody>
			</JetpackPluginSidebar>
			<PluginPrePublishPanel
				title={ title }
				icon={ <JetpackEditorPanelLogo /> }
				initialOpen={ false }
			>
				<Proofread busy={ isRedirecting } disabled={ requireUpgrade } />
				{ requireUpgrade && <Upgrade onClick={ autosaveAndRedirect } /> }
			</PluginPrePublishPanel>
		</>
	);
}
