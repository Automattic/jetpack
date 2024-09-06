/**
 * External dependencies
 */
import { JetpackEditorPanelLogo } from '@automattic/jetpack-shared-extension-utils';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { PanelBody, PanelRow, BaseControl, ExternalLink } from '@wordpress/components';
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
import { FairUsageNotice } from '../../../../blocks/ai-assistant/components/quota-exceeded-message';
import useAICheckout from '../../../../blocks/ai-assistant/hooks/use-ai-checkout';
import useAiFeature from '../../../../blocks/ai-assistant/hooks/use-ai-feature';
import useAiProductPage from '../../../../blocks/ai-assistant/hooks/use-ai-product-page';
import { getFeatureAvailability } from '../../../../blocks/ai-assistant/lib/utils/get-feature-availability';
import JetpackPluginSidebar from '../../../../shared/jetpack-plugin-sidebar';
import { PLAN_TYPE_FREE, PLAN_TYPE_UNLIMITED, usePlanType } from '../../../../shared/use-plan-type';
import { FeaturedImage } from '../ai-image';
import { Breve, registerBreveHighlights, Highlight } from '../breve';
import { getBreveAvailability, canWriteBriefBeEnabled } from '../breve/utils/get-availability';
import Feedback from '../feedback';
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
/**
 * TODO: use getFeatureAvailability for all the checks below.
 */
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
// Determine if the AI Title Optimization Keywords feature is available
const isAITitleOptimizationKeywordsFeatureAvailable = getFeatureAvailability(
	'ai-title-optimization-keywords-support'
);

const JetpackAndSettingsContent = ( {
	placement,
	requireUpgrade,
	upgradeType,
	showUsagePanel,
	showFairUsageNotice,
}: JetpackSettingsContentProps ) => {
	const { checkoutUrl } = useAICheckout();
	const { productPageUrl } = useAiProductPage();
	const isBreveAvailable = getBreveAvailability();

	const currentTitleOptimizationSectionLabel = __( 'Optimize Publishing', 'jetpack' );
	const SEOTitleOptimizationSectionLabel = __( 'Optimize Title', 'jetpack' );
	const titleOptimizationSectionLabel = isAITitleOptimizationKeywordsFeatureAvailable
		? SEOTitleOptimizationSectionLabel
		: currentTitleOptimizationSectionLabel;

	return (
		<>
			{ showFairUsageNotice && (
				<PanelRow className="jetpack-ai-sidebar__feature-section">
					<BaseControl>
						<FairUsageNotice variant="muted" />
					</BaseControl>
				</PanelRow>
			) }

			{ canWriteBriefBeEnabled() && isBreveAvailable && (
				<PanelRow>
					<BaseControl label={ __( 'Write Brief with AI (BETA)', 'jetpack' ) }>
						<Breve />
					</BaseControl>
				</PanelRow>
			) }

			<PanelRow className="jetpack-ai-sidebar__feature-section">
				<BaseControl label={ __( 'AI Feedback', 'jetpack' ) }>
					<Feedback placement={ placement } busy={ false } disabled={ requireUpgrade } />
				</BaseControl>
			</PanelRow>

			{ isAITitleOptimizationAvailable && (
				<PanelRow className="jetpack-ai-sidebar__feature-section">
					<BaseControl label={ titleOptimizationSectionLabel }>
						<TitleOptimization placement={ placement } busy={ false } disabled={ requireUpgrade } />
					</BaseControl>
				</PanelRow>
			) }
			{ isAIFeaturedImageAvailable && (
				<PanelRow className="jetpack-ai-sidebar__feature-section">
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
			{ isUsagePanelAvailable && showUsagePanel && (
				<PanelRow className="jetpack-ai-sidebar__feature-section">
					<UsagePanel placement={ placement } />
				</PanelRow>
			) }

			<PanelRow>
				<ExternalLink href="https://jetpack.com/redirect/?source=jetpack-ai-feedback">
					{ __( 'Provide feedback', 'jetpack' ) }
				</ExternalLink>
			</PanelRow>

			<PanelRow>
				<ExternalLink href={ productPageUrl }>
					{ __( 'Learn more about Jetpack AI', 'jetpack' ) }
				</ExternalLink>
			</PanelRow>

			<PanelRow>
				<ExternalLink href="https://automattic.com/ai-guidelines">
					{ __( 'AI Guidelines', 'jetpack' ) }
				</ExternalLink>
			</PanelRow>
		</>
	);
};

export default function AiAssistantPluginSidebar() {
	const { requireUpgrade, upgradeType, currentTier, tierPlansEnabled, isOverLimit } =
		useAiFeature();
	const { checkoutUrl } = useAICheckout();
	const { tracks } = useAnalytics();
	const isBreveAvailable = getBreveAvailability();

	const isViewable = useSelect( select => {
		const postTypeName = ( select( editorStore ) as typeof EditorSelectors ).getCurrentPostType();
		// The coreStore select type lacks the getPostType method, so we need to cast it to the correct type
		const postTypeObject = ( select( coreStore ) as unknown as CoreSelect ).getPostType(
			postTypeName
		);

		return postTypeObject?.viewable;
	}, [] );

	const planType = usePlanType( currentTier );

	// If the post type is not viewable, do not render my plugin.
	if ( ! isViewable ) {
		return null;
	}

	const title = __( 'AI Assistant', 'jetpack' );

	const panelToggleTracker = placement => {
		debug( placement );
		tracks.recordEvent( 'jetpack_ai_panel_open', { placement } );
	};

	const showUsagePanel =
		planType === PLAN_TYPE_FREE || ( tierPlansEnabled && planType !== PLAN_TYPE_UNLIMITED );
	const showFairUsageNotice = planType === PLAN_TYPE_UNLIMITED && isOverLimit;

	return (
		<>
			{ isBreveAvailable && <Highlight /> }
			<JetpackPluginSidebar>
				<PanelBody
					title={ title }
					initialOpen={ false }
					onToggle={ isOpen => {
						isOpen && panelToggleTracker( PLACEMENT_JETPACK_SIDEBAR );
					} }
					className="jetpack-ai-assistant-panel"
				>
					<JetpackAndSettingsContent
						placement={ PLACEMENT_JETPACK_SIDEBAR }
						requireUpgrade={ requireUpgrade }
						upgradeType={ upgradeType }
						showUsagePanel={ showUsagePanel }
						showFairUsageNotice={ showFairUsageNotice }
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
					showUsagePanel={ showUsagePanel }
					showFairUsageNotice={ showFairUsageNotice }
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
					<Feedback
						placement={ PLACEMENT_PRE_PUBLISH }
						busy={ false }
						disabled={ requireUpgrade }
					/>
					{ requireUpgrade && tierPlansEnabled && (
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

// Register the highlight format type from the Breve component
registerBreveHighlights();
