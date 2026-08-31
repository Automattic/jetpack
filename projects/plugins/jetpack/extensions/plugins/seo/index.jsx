/**
 * External dependencies
 */
import { LinkPreviewModalWithTrigger } from '@automattic/jetpack-publicize/link-preview';
import { isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import {
	useModuleStatus,
	getJetpackExtensionAvailability,
	getRequiredPlan,
} from '@automattic/jetpack-shared-extension-utils';
import { JetpackEditorPanelLogo } from '@automattic/jetpack-shared-extension-utils/components';
import { PanelBody, PanelRow } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, select as globalSelect, useDispatch } from '@wordpress/data';
import {
	PluginDocumentSettingPanel,
	PluginPrePublishPanel,
	PluginPostPublishPanel,
	store as editorStore,
} from '@wordpress/editor';
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import JetpackPluginSidebar from '../../shared/jetpack-plugin-sidebar';
import { SeoEnhancer } from '../ai-assistant-plugin/components/seo-enhancer';
import { canAutoEnhanceMetadata } from '../ai-assistant-plugin/components/seo-enhancer/can-auto-enhance-metadata';
import { isAiSeoEnabled } from '../ai-assistant-plugin/components/seo-enhancer/is-ai-seo-enabled';
import { SeoSummary } from '../ai-assistant-plugin/components/seo-enhancer/seo-summary';
import { useSeoModuleSettings } from '../ai-assistant-plugin/components/seo-enhancer/use-seo-module-settings';
import { useSeoRequests } from '../ai-assistant-plugin/components/seo-enhancer/use-seo-requests';
import { SeoPlaceholder } from './components/placeholder';
import { SeoSkeletonLoader } from './components/skeleton-loader';
import UpsellNotice from './components/upsell';
import SeoDescriptionPanel from './description-panel';
import SeoNoindexPanel from './noindex-panel';
import SeoSchemaPanel from './schema-panel';
import { showSeoSection } from './show-seo-section';
import SeoTitlePanel from './title-panel';
import './editor.scss';

export const name = 'seo';

// On P2 this function is not available, causing an error
const supportsPublishSidebar =
	typeof globalSelect( editorStore ).isPublishSidebarOpened === 'function';

const isSeoEnhancerAvailable =
	getJetpackExtensionAvailability( 'ai-seo-enhancer' )?.available === true &&
	supportsPublishSidebar;

// Automatic generation never runs on Simple sites and follows the AI SEO
// feature everywhere else.
const canHaveAutoEnhance = canAutoEnhanceMetadata();

// The AI SEO feature covers manual and automatic generation alike (host and
// master gates folded in server-side); with it off the enhancer is not
// rendered at all.
const isAiSeoFeatureEnabled = isAiSeoEnabled();

const Seo = () => {
	const { isLoadingModules, isChangingStatus, isModuleActive, changeStatus } =
		useModuleStatus( 'seo-tools' );
	const isPrePublishPanelOpen = useSelect(
		select => select( editorStore ).isPublishSidebarOpened?.(),
		[]
	);

	const { updateSeoData, isBusy } = useSeoRequests();
	const isViewable = useSelect( select => {
		const postTypeName = select( editorStore ).getCurrentPostType();
		const postTypeObject = select( coreStore ).getPostType( postTypeName );

		return postTypeObject?.viewable;
	}, [] );
	const previousIsOpenRef = useRef( false );
	const { isEnabled: isAutoEnhanceEnabled, isToggling } = useSeoModuleSettings();
	const { closePublishSidebar } = useDispatch( editorStore );

	useEffect( () => {
		if (
			isSeoEnhancerAvailable &&
			isPrePublishPanelOpen &&
			! previousIsOpenRef.current &&
			! isBusy &&
			isAutoEnhanceEnabled &&
			! isToggling &&
			canHaveAutoEnhance &&
			supportsPublishSidebar
		) {
			updateSeoData( { trigger: 'auto' } );
		}

		previousIsOpenRef.current = isPrePublishPanelOpen;
	}, [ isPrePublishPanelOpen, updateSeoData, isBusy, isAutoEnhanceEnabled, isToggling ] );

	const handleSummaryEdit = async () => {
		await closePublishSidebar();
		showSeoSection();
	};

	// If the post type is not viewable, do not render my plugin.
	if ( ! isViewable ) {
		return null;
	}

	const requiredPlan = getRequiredPlan( 'advanced-seo' );
	const canShowUpsell = isWpcomPlatformSite();
	const hasRequiredPlanForEnhancer = ! getRequiredPlan( 'ai-seo-enhancer' );

	if ( canShowUpsell && requiredPlan !== false ) {
		return (
			<>
				<JetpackPluginSidebar>
					<PanelBody
						title={ __( 'Optimize SEO', 'jetpack' ) }
						initialOpen={ false }
						className="jetpack-seo-panel"
					>
						<UpsellNotice requiredPlan={ requiredPlan } />
					</PanelBody>
				</JetpackPluginSidebar>
				<PluginDocumentSettingPanel
					className="jetpack-seo-panel"
					title={ __( 'Optimize SEO', 'jetpack' ) }
					name="jetpack-seo"
					icon={ <JetpackEditorPanelLogo /> }
				>
					<UpsellNotice requiredPlan={ requiredPlan } />
				</PluginDocumentSettingPanel>
			</>
		);
	}

	if ( ! isModuleActive ) {
		const moduleInactiveContent = isLoadingModules ? (
			<SeoSkeletonLoader />
		) : (
			<SeoPlaceholder
				changeStatus={ changeStatus }
				isModuleActive={ isModuleActive }
				isLoading={ isChangingStatus }
			/>
		);

		return (
			<>
				<JetpackPluginSidebar>
					<PanelBody
						title={ __( 'Optimize SEO', 'jetpack' ) }
						initialOpen={ false }
						className="jetpack-seo-panel"
					>
						{ moduleInactiveContent }
					</PanelBody>
				</JetpackPluginSidebar>
				<PluginDocumentSettingPanel
					className="jetpack-seo-panel"
					title={ __( 'Optimize SEO', 'jetpack' ) }
					name="jetpack-seo"
					icon={ <JetpackEditorPanelLogo /> }
				>
					{ moduleInactiveContent }
				</PluginDocumentSettingPanel>
			</>
		);
	}

	const jetpackSeoPublishPanelsProps = {
		icon: <JetpackEditorPanelLogo />,
		title: __( 'SEO', 'jetpack' ),
		initialOpen: isSeoEnhancerAvailable && isAiSeoFeatureEnabled,
	};

	// TODO: remove all code related to the SeoAssistantWizard if it's a no-go
	return (
		<>
			<JetpackPluginSidebar>
				<PanelBody title={ __( 'Optimize SEO', 'jetpack' ) } className="jetpack-seo-panel">
					{ isSeoEnhancerAvailable && hasRequiredPlanForEnhancer && isAiSeoFeatureEnabled && (
						<SeoEnhancer placement="jetpack-sidebar" disableAutoEnhance={ ! canHaveAutoEnhance } />
					) }
					<PanelRow
						className={ clsx( {
							'jetpack-seo-sidebar__feature-section':
								isSeoEnhancerAvailable && isAiSeoFeatureEnabled,
						} ) }
					>
						<SeoTitlePanel />
					</PanelRow>
					<PanelRow
						className={ clsx( {
							'jetpack-seo-sidebar__feature-section':
								isSeoEnhancerAvailable && isAiSeoFeatureEnabled,
						} ) }
					>
						<SeoDescriptionPanel />
					</PanelRow>
					<PanelRow
						className={ clsx( {
							'jetpack-seo-sidebar__feature-section':
								isSeoEnhancerAvailable && isAiSeoFeatureEnabled,
						} ) }
					>
						<LinkPreviewModalWithTrigger />
					</PanelRow>
					<PanelRow
						className={ clsx( {
							'jetpack-seo-sidebar__feature-section':
								isSeoEnhancerAvailable && isAiSeoFeatureEnabled,
						} ) }
					>
						<SeoNoindexPanel />
					</PanelRow>
					<PanelRow
						className={ clsx( {
							'jetpack-seo-sidebar__feature-section':
								isSeoEnhancerAvailable && isAiSeoFeatureEnabled,
						} ) }
					>
						<SeoSchemaPanel />
					</PanelRow>
				</PanelBody>
			</JetpackPluginSidebar>

			<PluginDocumentSettingPanel
				className="jetpack-seo-panel"
				title={ __( 'Optimize SEO', 'jetpack' ) }
				name="jetpack-seo"
				icon={ <JetpackEditorPanelLogo /> }
			>
				{ isSeoEnhancerAvailable && hasRequiredPlanForEnhancer && isAiSeoFeatureEnabled && (
					<SeoEnhancer placement="document-settings" disableAutoEnhance={ ! canHaveAutoEnhance } />
				) }
				<PanelRow>
					<SeoTitlePanel />
				</PanelRow>
				<PanelRow>
					<SeoDescriptionPanel />
				</PanelRow>
				<PanelRow>
					<LinkPreviewModalWithTrigger />
				</PanelRow>
				<PanelRow>
					<SeoNoindexPanel />
				</PanelRow>
				<PanelRow>
					<SeoSchemaPanel />
				</PanelRow>
			</PluginDocumentSettingPanel>

			<PluginPrePublishPanel { ...jetpackSeoPublishPanelsProps }>
				<div className="jetpack-seo-panel">
					{ isSeoEnhancerAvailable && hasRequiredPlanForEnhancer && isAiSeoFeatureEnabled && (
						<SeoEnhancer
							placement="jetpack-prepublish-sidebar"
							disableAutoEnhance={ ! canHaveAutoEnhance }
						/>
					) }
					<PanelRow>
						<SeoTitlePanel />
					</PanelRow>
					<PanelRow>
						<SeoDescriptionPanel />
					</PanelRow>
					<PanelRow>
						<LinkPreviewModalWithTrigger />
					</PanelRow>
					<PanelRow>
						<SeoNoindexPanel />
					</PanelRow>
					<PanelRow>
						<SeoSchemaPanel />
					</PanelRow>
				</div>
			</PluginPrePublishPanel>

			{ isSeoEnhancerAvailable && isAiSeoFeatureEnabled && (
				<PluginPostPublishPanel { ...jetpackSeoPublishPanelsProps }>
					<div className="jetpack-seo-panel">
						<SeoSummary onEdit={ handleSummaryEdit } />
					</div>
				</PluginPostPublishPanel>
			) }
		</>
	);
};

export const settings = {
	render: () => <Seo />,
};
