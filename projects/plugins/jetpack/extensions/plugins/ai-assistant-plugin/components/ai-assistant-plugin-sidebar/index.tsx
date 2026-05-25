/**
 * External dependencies
 */
import {
	useAICheckout,
	useAiFeature,
	FairUsageNotice,
	FeaturedImage,
} from '@automattic/jetpack-ai-client';
import {
	useAnalytics,
	PLAN_TYPE_FREE,
	PLAN_TYPE_UNLIMITED,
	usePlanType,
} from '@automattic/jetpack-shared-extension-utils';
import { JetpackEditorPanelLogo } from '@automattic/jetpack-shared-extension-utils/components';
import { PanelBody, PanelRow, BaseControl, Button, Notice } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	PluginPrePublishPanel,
	PluginDocumentSettingPanel,
	store as editorStore,
} from '@wordpress/editor';
import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import debugFactory from 'debug';
import { ComponentType, useCallback, useMemo } from 'react';
/**
 * Internal dependencies
 */
import useAiProductPage from '../../../../blocks/ai-assistant/hooks/use-ai-product-page';
import { getFeatureAvailability } from '../../../../blocks/ai-assistant/lib/utils/get-feature-availability';
import JetpackPluginSidebar from '../../../../shared/jetpack-plugin-sidebar';
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
import type { CoreSelect, JetpackSettingsContentProps, PanelProps } from './types';

const PrePublishPanel = PluginPrePublishPanel as ComponentType< PanelProps >;
const DocumentPanel = PluginDocumentSettingPanel as ComponentType< PanelProps >;

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
	const isPostEmpty = useSelect( select => select( editorStore ).isEditedPostEmpty(), [] );
	const { editPost } = useDispatch( editorStore );

	const onImageSelect = useCallback(
		( image: { id: number; url: string; mime?: string } ) => {
			editPost( { featured_media: image.id } );
		},
		[ editPost ]
	);

	/**
	 * Filters the image generation handler for AI-powered image creation entry points.
	 *
	 * Allows external plugins (e.g. Image Studio) to provide a custom handler that
	 * replaces the default image generation UI. When a handler is returned, it is
	 * called to open the external image generation flow instead of the built-in one.
	 *
	 * @param {Function|null} handler                 - The handler function, or null if no handler is registered.
	 * @param {object}        options                 - Options describing the entry point context.
	 * @param {string}        options.entryPoint      - Identifies the UI location (e.g. 'featured-image').
	 * @param {Function}      options.onImageSelect   - Callback invoked with the selected image ({ id, url, mime? }).
	 * @param {object}        options.extra           - Additional context for the handler.
	 * @param {string}        options.extra.placement - The placement identifier for the entry point.
	 * @param {boolean}       options.extra.disabled  - Whether the handler should be disabled (e.g. upgrade required).
	 * @return {Function|null} A function to invoke the image generation flow, or null to use the default behavior.
	 *
	 * @example
	 * // Register a custom image generation handler from an external plugin.
	 * import { addFilter } from '@wordpress/hooks';
	 *
	 * addFilter( 'jetpack.ai.imageGenerationHandler', 'my-plugin/image-studio', ( handler, options ) => {
	 *     return () => openImageStudio( options.entryPoint, options.onImageSelect );
	 * } );
	 */
	const imageGenerationHandler = useMemo( () => {
		const result = applyFilters( 'jetpack.ai.imageGenerationHandler', null, {
			entryPoint: 'featured-image',
			onImageSelect,
			extra: { placement, disabled: requireUpgrade },
		} );
		return typeof result === 'function' ? ( result as () => void ) : null;
	}, [ onImageSelect, placement, requireUpgrade ] );

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
			{ ( imageGenerationHandler || isAIFeaturedImageAvailable ) && (
				<PanelRow className="jetpack-ai-sidebar__feature-section">
					<BaseControl __nextHasNoMarginBottom={ true }>
						<BaseControl.VisualLabel>
							{ __( 'Get Featured Image', 'jetpack' ) }
						</BaseControl.VisualLabel>
						{ imageGenerationHandler ? (
							<Button
								onClick={ imageGenerationHandler }
								variant="secondary"
								disabled={ requireUpgrade }
							>
								{ __( 'Generate image', 'jetpack' ) }
							</Button>
						) : (
							<FeaturedImage busy={ false } disabled={ requireUpgrade } placement={ placement } />
						) }
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
				<Link openInNewTab href={ productPageUrl }>
					{ __( 'Learn more about Jetpack AI', 'jetpack' ) }
				</Link>
			</PanelRow>
			<PanelRow className="jetpack-ai-sidebar__external-link">
				<Link openInNewTab href="https://jetpack.com/redirect/?source=jetpack-ai-feedback">
					{ __( 'Give us feedback', 'jetpack' ) }
				</Link>
			</PanelRow>
			<PanelRow className="jetpack-ai-sidebar__external-link">
				<Link openInNewTab href="https://jetpack.com/redirect/?source=ai-guidelines">
					{ __( 'AI guidelines', 'jetpack' ) }
				</Link>
			</PanelRow>
			{ canWriteBriefBeEnabled() && ! isBreveAvailable && (
				<PanelRow className="jetpack-ai-sidebar__external-link">
					<Link
						openInNewTab
						href="https://jetpack.com/support/publish-better-content-with-write-brief-with-ai/"
					>
						{ __( 'Update on Write Brief (Beta)', 'jetpack' ) }
					</Link>
				</PanelRow>
			) }
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

	const title = __( 'Improve with AI', 'jetpack' );

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

			<DocumentPanel
				title={ title }
				name="jetpack-ai-assistant"
				icon={ <JetpackEditorPanelLogo /> }
			>
				<JetpackAndSettingsContent
					placement={ PLACEMENT_DOCUMENT_SETTINGS }
					requireUpgrade={ requireUpgrade }
					upgradeType={ upgradeType }
					showUsagePanel={ showUsagePanel }
					showFairUsageNotice={ showFairUsageNotice }
				/>
			</DocumentPanel>

			<PrePublishPanel title={ title } icon={ <JetpackEditorPanelLogo /> } initialOpen={ false }>
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
			</PrePublishPanel>
		</>
	);
}

// Register the highlight format type from the Breve component
registerBreveHighlights();
