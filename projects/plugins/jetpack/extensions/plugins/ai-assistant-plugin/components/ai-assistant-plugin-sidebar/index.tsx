/**
 * External dependencies
 */
import { JetpackEditorPanelLogo, useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { PanelBody, PanelRow, BaseControl, ExternalLink, Notice } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { PluginPrePublishPanel, PluginDocumentSettingPanel } from '@wordpress/edit-post';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import { FairUsageNotice } from '../../../../blocks/ai-assistant/components/quota-exceeded-message';
import useAICheckout from '../../../../blocks/ai-assistant/hooks/use-ai-checkout';
import useAiFeature from '../../../../blocks/ai-assistant/hooks/use-ai-feature';
import useAiProductPage from '../../../../blocks/ai-assistant/hooks/use-ai-product-page';
import { getFeatureAvailability } from '../../../../blocks/ai-assistant/lib/utils/get-feature-availability';
// import { isBetaExtension } from '../../../../editor';
import JetpackPluginSidebar from '../../../../shared/jetpack-plugin-sidebar';
import { PLAN_TYPE_FREE, PLAN_TYPE_UNLIMITED, usePlanType } from '../../../../shared/use-plan-type';
import { FeaturedImage } from '../ai-image';
import { Breve, registerBreveHighlights, Highlight } from '../breve';
import { getBreveAvailability, canWriteBriefBeEnabled } from '../breve/utils/get-availability';
import Feedback from '../feedback';
// import SeoAssistant from '../seo-assistant';
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

// const isSeoAssistantEnabled = getFeatureAvailability( 'ai-seo-assistant' );

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
	// const isViewable = useSelect( select => {
	// 	const postTypeName = select( editorStore ).getCurrentPostType();
	// 	const postTypeObject = ( select( coreStore ) as unknown as CoreSelect ).getPostType(
	// 		postTypeName
	// 	);

	// 	return postTypeObject?.viewable;
	// }, [] );

	const isPostEmpty = useSelect( select => select( editorStore ).isEditedPostEmpty(), [] );

	const currentTitleOptimizationSectionLabel = __( 'Optimize Publishing', 'jetpack' );
	const SEOTitleOptimizationSectionLabel = __( 'Optimize Title', 'jetpack' );
	const titleOptimizationSectionLabel = isAITitleOptimizationKeywordsFeatureAvailable
		? SEOTitleOptimizationSectionLabel
		: currentTitleOptimizationSectionLabel;

	return (
		<>
			{ showFairUsageNotice && (
				<PanelRow className="jetpack-ai-sidebar__feature-section">
					<BaseControl __nextHasNoMarginBottom={ true }>
						<FairUsageNotice variant="muted" />
					</BaseControl>
				</PanelRow>
			) }

			{ /* { isSeoAssistantEnabled && isViewable && (
				<PanelRow
					className={ `jetpack-ai-sidebar__feature-section ${
						isBetaExtension( 'ai-seo-assistant' ) ? 'is-beta-extension' : ''
					}` }
				>
					<BaseControl __nextHasNoMarginBottom={ true }>
						<BaseControl.VisualLabel>{ __( 'SEO', 'jetpack' ) }</BaseControl.VisualLabel>
						<SeoAssistant disabled={ false } />
					</BaseControl>
				</PanelRow>
			) } */ }

			{ isPostEmpty && (
				<PanelRow className="jetpack-ai-sidebar__warning-content">
					<Notice isDismissible={ false } status="warning">
						{ __( 'The following features require content to work.', 'jetpack' ) }
					</Notice>
				</PanelRow>
			) }

			{ canWriteBriefBeEnabled() && isBreveAvailable && (
				<PanelRow>
					<BaseControl __nextHasNoMarginBottom={ true }>
						<BaseControl.VisualLabel>
							{ __( 'Write Brief (Beta)', 'jetpack' ) }
						</BaseControl.VisualLabel>
						<Breve />
					</BaseControl>
				</PanelRow>
			) }

			{ isAITitleOptimizationAvailable && (
				<PanelRow className="jetpack-ai-sidebar__feature-section">
					<BaseControl __nextHasNoMarginBottom={ true }>
						<BaseControl.VisualLabel>{ titleOptimizationSectionLabel }</BaseControl.VisualLabel>
						<TitleOptimization placement={ placement } busy={ false } disabled={ requireUpgrade } />
					</BaseControl>
				</PanelRow>
			) }

			{ isAIFeaturedImageAvailable && (
				<PanelRow className="jetpack-ai-sidebar__feature-section">
					<BaseControl __nextHasNoMarginBottom={ true }>
						<BaseControl.VisualLabel>
							{ __( 'Get Featured Image', 'jetpack' ) }
						</BaseControl.VisualLabel>
						<FeaturedImage busy={ false } disabled={ requireUpgrade } placement={ placement } />
					</BaseControl>
				</PanelRow>
			) }

			<PanelRow className="jetpack-ai-sidebar__feature-section">
				<BaseControl __nextHasNoMarginBottom={ true }>
					<BaseControl.VisualLabel>{ __( 'Get Feedback', 'jetpack' ) }</BaseControl.VisualLabel>
					<Feedback placement={ placement } busy={ false } disabled={ requireUpgrade } />
				</BaseControl>
			</PanelRow>

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

			<PanelRow className="jetpack-ai-sidebar__external-link">
				<ExternalLink href={ productPageUrl }>
					{ __( 'Learn more about Jetpack AI', 'jetpack' ) }
				</ExternalLink>
			</PanelRow>

			<PanelRow className="jetpack-ai-sidebar__external-link">
				<ExternalLink href="https://jetpack.com/redirect/?source=jetpack-ai-feedback">
					{ __( 'Give us feedback', 'jetpack' ) }
				</ExternalLink>
			</PanelRow>

			<PanelRow className="jetpack-ai-sidebar__external-link">
				<ExternalLink href="https://jetpack.com/redirect/?source=ai-guidelines">
					{ __( 'AI guidelines', 'jetpack' ) }
				</ExternalLink>
			</PanelRow>
		</>
	);
};

export default function AiAssistantPluginSidebar() {
	const { requireUpgrade, upgradeType, currentTier, isOverLimit } = useAiFeature();
	const { tracks } = useAnalytics();

	const isViewable = useSelect( select => {
		const postTypeName = select( editorStore ).getCurrentPostType();
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

	const showUsagePanel = planType === PLAN_TYPE_FREE;
	const showFairUsageNotice = planType === PLAN_TYPE_UNLIMITED && isOverLimit;
	const isBreveAvailable = getBreveAvailability();

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
				</>
			</PluginPrePublishPanel>
		</>
	);
}

// Register the highlight format type from the Breve component
registerBreveHighlights();
