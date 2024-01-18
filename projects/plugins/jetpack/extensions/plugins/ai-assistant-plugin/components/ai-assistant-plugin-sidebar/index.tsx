/**
 * External dependencies
 */
import { JetpackEditorPanelLogo } from '@automattic/jetpack-shared-extension-utils';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button, PanelBody, PanelRow, BaseControl } from '@wordpress/components';
import { PluginPrePublishPanel } from '@wordpress/edit-post';
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import debugFactory from 'debug';
import React from 'react';
/**
 * Internal dependencies
 */
import useAICheckout from '../../../../blocks/ai-assistant/hooks/use-ai-checkout';
import useAiFeature from '../../../../blocks/ai-assistant/hooks/use-ai-feature';
import JetpackPluginSidebar from '../../../../shared/jetpack-plugin-sidebar';
import Proofread from '../proofread';
import UsagePanel from '../usage-panel';
import { USAGE_PANEL_PLACEMENT_JETPACK_SIDEBAR } from '../usage-panel/types';

const debug = debugFactory( 'jetpack-ai-assistant-plugin:sidebar' );
// Determine if the usage panel is enabled or not
const isUsagePanelAvailable =
	window?.Jetpack_Editor_Initial_State?.available_blocks?.[ 'ai-assistant-usage-panel' ]
		?.available || false;

const Upgrade = ( {
	onClick,
	type,
	placement = '',
}: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	onClick: ( event: any ) => void;
	type: string;
	placement?: string;
} ) => {
	const { tracks } = useAnalytics();

	const handleClick = useCallback(
		evt => {
			tracks.recordEvent( 'jetpack_ai_upgrade_button', { placement } );
			onClick?.( evt );
		},
		[ onClick, tracks, placement ]
	);

	const messageForVip = createInterpolateElement(
		__(
			"You've reached the Jetpack AI rate limit. <strong>Please reach out to your VIP account team.</strong>",
			'jetpack'
		),
		{
			strong: <strong />,
		}
	);

	const defaultUpgradeMessage = createInterpolateElement(
		__(
			'You have reached the limit of 20 free requests. <button>Upgrade to continue generating feedback.</button>',
			'jetpack'
		),
		{
			button: <Button variant="link" onClick={ handleClick } />,
		}
	);

	return <div>{ type === 'vip' ? messageForVip : defaultUpgradeMessage }</div>;
};

export default function AiAssistantPluginSidebar() {
	const { requireUpgrade, upgradeType } = useAiFeature();
	const { autosaveAndRedirect, isRedirecting } = useAICheckout();

	const { tracks } = useAnalytics();
	const title = __( 'AI Assistant', 'jetpack' );

	const panelToggleTracker = placement => {
		debug( placement );
		tracks.recordEvent( 'jetpack_ai_panel_open', { placement } );
	};

	return (
		<>
			<JetpackPluginSidebar>
				<PanelBody
					title={ title }
					initialOpen={ false }
					onToggle={ isOpen => {
						isOpen && panelToggleTracker( 'jetpack-sidebar' );
					} }
				>
					<PanelRow>
						<BaseControl
							className="jetpack-ai-proofread-control__header"
							label={ __( 'AI feedback on post', 'jetpack' ) }
						>
							<Proofread busy={ isRedirecting } disabled={ requireUpgrade } />
						</BaseControl>
					</PanelRow>
					{ requireUpgrade && ! isUsagePanelAvailable && (
						<PanelRow>
							<Upgrade
								placement="jetpack-sidebar"
								onClick={ autosaveAndRedirect }
								type={ upgradeType }
							/>
						</PanelRow>
					) }
					{ isUsagePanelAvailable && (
						<PanelRow>
							<UsagePanel placement={ USAGE_PANEL_PLACEMENT_JETPACK_SIDEBAR } />
						</PanelRow>
					) }
				</PanelBody>
			</JetpackPluginSidebar>

			<PluginPrePublishPanel
				title={ title }
				icon={ <JetpackEditorPanelLogo /> }
				initialOpen={ false }
			>
				<>
					<Proofread busy={ isRedirecting } disabled={ requireUpgrade } />
					{ requireUpgrade && (
						<Upgrade placement="pre-publish" onClick={ autosaveAndRedirect } type={ upgradeType } />
					) }
				</>
			</PluginPrePublishPanel>
		</>
	);
}
