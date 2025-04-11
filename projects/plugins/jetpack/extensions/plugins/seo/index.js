/**
 * External dependencies
 */
import {
	useModuleStatus,
	isSimpleSite,
	isAtomicSite,
	getJetpackExtensionAvailability,
	getRequiredPlan,
} from '@automattic/jetpack-shared-extension-utils';
import { JetpackEditorPanelLogo } from '@automattic/jetpack-shared-extension-utils/components';
import { PanelBody, PanelRow } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, select as globalSelect, useDispatch } from '@wordpress/data';
import {
	PluginPrePublishPane as DeprecatedPluginPrePublishPanel,
	PluginPostPublishPanel as DeprecatedPluginPostPublishPanel,
} from '@wordpress/edit-post';
import {
	PluginPrePublishPanel as EditorPluginPrePublishPanel,
	PluginPostPublishPanel as EditorPluginPostPublishPanel,
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
import { SeoSummary } from '../ai-assistant-plugin/components/seo-enhancer/seo-summary';
import { useSeoModuleSettings } from '../ai-assistant-plugin/components/seo-enhancer/use-seo-module-settings';
import { useSeoRequests } from '../ai-assistant-plugin/components/seo-enhancer/use-seo-requests';
import { SeoPlaceholder } from './components/placeholder';
import { SeoSkeletonLoader } from './components/skeleton-loader';
import UpsellNotice from './components/upsell';
import SeoDescriptionPanel from './description-panel';
import SeoNoindexPanel from './noindex-panel';
import { showSeoSection } from './show-seo-section';
import SeoTitlePanel from './title-panel';
import './editor.scss';

export const name = 'seo';

const PluginPrePublishPanel = EditorPluginPrePublishPanel || DeprecatedPluginPrePublishPanel;
const PluginPostPublishPanel = EditorPluginPostPublishPanel || DeprecatedPluginPostPublishPanel;

// On P2 this function is not available, causing an error
const supportsPublishSidebar =
	typeof globalSelect( editorStore ).isPublishSidebarOpened === 'function';

const isSeoEnhancerEnabled =
	getJetpackExtensionAvailability( 'ai-seo-enhancer' )?.available === true &&
	supportsPublishSidebar;

const canHaveAutoEnhance = ! isSimpleSite();

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
			isSeoEnhancerEnabled &&
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
	const canShowUpsell = isAtomicSite() || isSimpleSite();
	const hasRequiredPlanForEnhancer = ! getRequiredPlan( 'ai-seo-enhancer' );

	const jetpackSeoPanelProps = {
		title: __( 'SEO', 'jetpack' ),
	};

	if ( canShowUpsell && requiredPlan !== false ) {
		return (
			<>
				<JetpackPluginSidebar>
					<PanelBody
						className="jetpack-seo-panel"
						{ ...jetpackSeoPanelProps }
						initialOpen={ false }
					>
						<UpsellNotice requiredPlan={ requiredPlan } />
					</PanelBody>
				</JetpackPluginSidebar>
			</>
		);
	}

	if ( ! isModuleActive ) {
		return (
			<>
				<JetpackPluginSidebar>
					<PanelBody
						className="jetpack-seo-panel"
						{ ...jetpackSeoPanelProps }
						initialOpen={ false }
					>
						{ isLoadingModules ? (
							<SeoSkeletonLoader />
						) : (
							<SeoPlaceholder
								changeStatus={ changeStatus }
								isModuleActive={ isModuleActive }
								isLoading={ isChangingStatus }
							/>
						) }
					</PanelBody>
				</JetpackPluginSidebar>
			</>
		);
	}

	const jetpackSeoPublishPanelsProps = {
		icon: <JetpackEditorPanelLogo />,
		title: __( 'SEO', 'jetpack' ),
		initialOpen: isSeoEnhancerEnabled,
	};

	// TODO: remove all code related to the SeoAssistantWizard if it's a no-go
	return (
		<>
			<JetpackPluginSidebar>
				<PanelBody className="jetpack-seo-panel" { ...jetpackSeoPanelProps }>
					{ isSeoEnhancerEnabled && hasRequiredPlanForEnhancer && (
						<SeoEnhancer placement="jetpack-sidebar" disableAutoEnhance={ ! canHaveAutoEnhance } />
					) }
					<PanelRow
						className={ clsx( {
							'jetpack-seo-sidebar__feature-section': isSeoEnhancerEnabled,
						} ) }
					>
						<SeoTitlePanel />
					</PanelRow>
					<PanelRow
						className={ clsx( {
							'jetpack-seo-sidebar__feature-section': isSeoEnhancerEnabled,
						} ) }
					>
						<SeoDescriptionPanel />
					</PanelRow>
					<PanelRow
						className={ clsx( {
							'jetpack-seo-sidebar__feature-section': isSeoEnhancerEnabled,
						} ) }
					>
						<SeoNoindexPanel />
					</PanelRow>
				</PanelBody>
			</JetpackPluginSidebar>

			<PluginPrePublishPanel { ...jetpackSeoPublishPanelsProps }>
				<div className="jetpack-seo-panel">
					{ isSeoEnhancerEnabled && hasRequiredPlanForEnhancer && (
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
						<SeoNoindexPanel />
					</PanelRow>
				</div>
			</PluginPrePublishPanel>

			{ isSeoEnhancerEnabled && (
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
