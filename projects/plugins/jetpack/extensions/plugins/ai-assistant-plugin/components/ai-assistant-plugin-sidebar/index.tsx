/**
 * External dependencies
 */
import { JetpackEditorPanelLogo } from '@automattic/jetpack-shared-extension-utils';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { PanelBody, PanelRow, BaseControl } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { PluginPrePublishPanel, PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import debugFactory from 'debug';
import React from 'react';
/**
 * Internal dependencies
 */
import useAICheckout from '../../../../blocks/ai-assistant/hooks/use-ai-checkout';
import useAiFeature from '../../../../blocks/ai-assistant/hooks/use-ai-feature';
import { getFeatureAvailability } from '../../../../blocks/ai-assistant/lib/utils/get-feature-availability';
import JetpackPluginSidebar from '../../../../shared/jetpack-plugin-sidebar';
import { FeaturedImage } from '../ai-image';
import { Breve } from '../breve';
import Proofread from '../proofread';
import TitleOptimization from '../title-optimization';
import UsagePanel from '../usage-panel';
import {
	PLACEMENT_DOCUMENT_SETTINGS,
	PLACEMENT_JETPACK_SIDEBAR,
	PLACEMENT_PRE_PUBLISH,
} from './constants';
import Upgrade from './upgrade';
import './style.scss';
/**
 * Types
 */
import type { CoreSelect, JetpackSettingsContentProps } from './types';
import type * as EditorSelectors from '@wordpress/editor/store/selectors';

const debug = debugFactory( 'jetpack-ai-assistant-plugin:sidebar' );
// Determine if the usage panel is enabled or not
const isUsagePanelAvailable =
	window?.Jetpack_Editor_Initial_State?.available_blocks?.[ 'ai-assistant-usage-panel' ]
		?.available || false;
// Determine if the AI Featured Image feature is available
const isAIFeaturedImageAvailable =
	window?.Jetpack_Editor_Initial_State?.available_blocks?.[ 'ai-featured-image-generator' ]
		?.available || false;
// Determine if the AI Title Optimization feature is available
const isAITitleOptimizationAvailable =
	window?.Jetpack_Editor_Initial_State?.available_blocks?.[ 'ai-title-optimization' ]?.available ||
	false;

const JetpackAndSettingsContent = ( {
	placement,
	requireUpgrade,
	upgradeType,
}: JetpackSettingsContentProps ) => {
	const { checkoutUrl } = useAICheckout();
	const isBreveAvailable = getFeatureAvailability( 'ai-proofread-breve' );

	return (
		<>
			{ isAITitleOptimizationAvailable && (
				<PanelRow className="jetpack-ai-title-optimization__header">
					<BaseControl label={ __( 'Optimize Publishing', 'jetpack' ) }>
						<TitleOptimization placement={ placement } busy={ false } disabled={ requireUpgrade } />
					</BaseControl>
				</PanelRow>
			) }
			<PanelRow className="jetpack-ai-proofread-control__header">
				<BaseControl label={ __( 'AI feedback on post', 'jetpack' ) }>
					{ isBreveAvailable && <Breve /> }
					<Proofread placement={ placement } busy={ false } disabled={ requireUpgrade } />
				</BaseControl>
			</PanelRow>
			{ isAIFeaturedImageAvailable && (
				<PanelRow className="jetpack-ai-featured-image-control__header">
					<BaseControl label={ __( 'AI Featured Image', 'jetpack' ) }>
						<FeaturedImage busy={ false } disabled={ requireUpgrade } placement={ placement } />
					</BaseControl>
				</PanelRow>
			) }
			{ requireUpgrade && ! isUsagePanelAvailable && (
				<PanelRow>
					<Upgrade placement={ placement } type={ upgradeType } upgradeUrl={ checkoutUrl } />
				</PanelRow>
			) }
			{ isUsagePanelAvailable && (
				<PanelRow>
					<UsagePanel placement={ placement } />
				</PanelRow>
			) }
		</>
	);
};

export default function AiAssistantPluginSidebar() {
	const { requireUpgrade, upgradeType, currentTier } = useAiFeature();
	const { checkoutUrl } = useAICheckout();

	const { tracks } = useAnalytics();

	const isViewable = useSelect( select => {
		const postTypeName = ( select( editorStore ) as typeof EditorSelectors ).getCurrentPostType();
		// The coreStore select type lacks the getPostType method, so we need to cast it to the correct type
		const postTypeObject = ( select( coreStore ) as unknown as CoreSelect ).getPostType(
			postTypeName
		);

		return postTypeObject?.viewable;
	}, [] );
	// If the post type is not viewable, do not render my plugin.
	if ( ! isViewable ) {
		return null;
	}

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
						isOpen && panelToggleTracker( PLACEMENT_JETPACK_SIDEBAR );
					} }
				>
					<JetpackAndSettingsContent
						placement={ PLACEMENT_JETPACK_SIDEBAR }
						requireUpgrade={ requireUpgrade }
						upgradeType={ upgradeType }
					/>
				</PanelBody>
			</JetpackPluginSidebar>

			<PluginDocumentSettingPanel
				icon={ <JetpackEditorPanelLogo /> }
				title={ title }
				name="jetpack-ai-assistant"
			>
				<JetpackAndSettingsContent
					placement={ PLACEMENT_DOCUMENT_SETTINGS }
					requireUpgrade={ requireUpgrade }
					upgradeType={ upgradeType }
				/>
			</PluginDocumentSettingPanel>

			<PluginPrePublishPanel
				title={ title }
				icon={ <JetpackEditorPanelLogo /> }
				initialOpen={ false }
			>
				<>
					{ isAITitleOptimizationAvailable && (
						<TitleOptimization
							placement={ PLACEMENT_PRE_PUBLISH }
							busy={ false }
							disabled={ requireUpgrade }
						/>
					) }
					<Proofread
						placement={ PLACEMENT_PRE_PUBLISH }
						busy={ false }
						disabled={ requireUpgrade }
					/>
					{ requireUpgrade && (
						<Upgrade
							placement={ PLACEMENT_PRE_PUBLISH }
							type={ upgradeType }
							currentTier={ currentTier }
							upgradeUrl={ checkoutUrl }
						/>
					) }
				</>
			</PluginPrePublishPanel>
		</>
	);
}
