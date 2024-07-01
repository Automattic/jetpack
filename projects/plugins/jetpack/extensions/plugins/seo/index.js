import {
	JetpackEditorPanelLogo,
	useModuleStatus,
	isSimpleSite,
	isAtomicSite,
	getRequiredPlan,
} from '@automattic/jetpack-shared-extension-utils';
import { PanelBody, PanelRow } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { PluginPrePublishPanel } from '@wordpress/edit-post';
import { store as editorStore } from '@wordpress/editor';
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import JetpackPluginSidebar from '../../shared/jetpack-plugin-sidebar';
import { SeoPlaceholder } from './components/placeholder';
import { SeoSkeletonLoader } from './components/skeleton-loader';
import UpsellNotice from './components/upsell';
import SeoDescriptionPanel from './description-panel';
import SeoNoindexPanel from './noindex-panel';
import SeoTitlePanel from './title-panel';

import './editor.scss';

export const name = 'seo';

const Seo = () => {
	const { isLoadingModules, isChangingStatus, isModuleActive, changeStatus } =
		useModuleStatus( 'seo-tools' );

	const requiredPlan = getRequiredPlan( 'advanced-seo' );
	const canShowUpsell = isAtomicSite() || isSimpleSite();

	const isViewable = useSelect( select => {
		const postTypeName = select( editorStore ).getCurrentPostType();
		const postTypeObject = select( coreStore ).getPostType( postTypeName );

		return postTypeObject?.viewable;
	}, [] );
	// If the post type is not viewable, do not render my plugin.
	if ( ! isViewable ) {
		return null;
	}

	const jetpackSeoPanelProps = {
		title: __( 'SEO', 'jetpack' ),
	};

	if ( canShowUpsell && requiredPlan !== false ) {
		return (
			<Fragment>
				<JetpackPluginSidebar>
					<PanelBody
						className="jetpack-seo-panel"
						{ ...jetpackSeoPanelProps }
						initialOpen={ false }
					>
						<UpsellNotice requiredPlan={ requiredPlan } />
					</PanelBody>
				</JetpackPluginSidebar>
			</Fragment>
		);
	}

	if ( ! isModuleActive ) {
		return (
			<Fragment>
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
			</Fragment>
		);
	}

	const jetpackSeoPrePublishPanelProps = {
		icon: <JetpackEditorPanelLogo />,
		title: __( 'SEO', 'jetpack' ),
	};

	return (
		<Fragment>
			<JetpackPluginSidebar>
				<PanelBody className="jetpack-seo-panel" { ...jetpackSeoPanelProps }>
					<PanelRow>
						<SeoTitlePanel />
					</PanelRow>
					<PanelRow>
						<SeoDescriptionPanel />
					</PanelRow>
					<PanelRow>
						<SeoNoindexPanel />
					</PanelRow>
				</PanelBody>
			</JetpackPluginSidebar>

			<PluginPrePublishPanel { ...jetpackSeoPrePublishPanelProps }>
				<Fragment>
					<PanelRow>
						<SeoTitlePanel />
					</PanelRow>
					<PanelRow>
						<SeoDescriptionPanel />
					</PanelRow>
					<PanelRow>
						<SeoNoindexPanel />
					</PanelRow>
				</Fragment>
			</PluginPrePublishPanel>
		</Fragment>
	);
};

export const settings = {
	render: () => <Seo />,
};
