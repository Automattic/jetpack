/**
 * Top-level Publicize plugin for Gutenberg editor.
 *
 * Hooks into Gutenberg's PluginPrePublishPanel
 * to display Jetpack's Publicize UI in the pre-publish flow.
 *
 * It also hooks into our dedicated Jetpack plugin sidebar and
 * displays the Publicize UI there.
 */
import {
	PublicizePanel,
	SocialImageGeneratorPanel,
	usePublicizeConfig,
} from '@automattic/jetpack-publicize-components';
import { useModuleStatus } from '@automattic/jetpack-shared-extension-utils';
import { PostTypeSupportCheck } from '@wordpress/editor';
import JetpackPluginSidebar from '../../shared/jetpack-plugin-sidebar';
import { PublicizePlaceholder } from './components/placeholder';
import PublicizeSkeletonLoader from './components/skeleton-loader';
import UpsellNotice from './components/upsell';
import PostPublishPanels from './post-publish';
import PrePublishPanels from './pre-publish';

import './editor.scss';

export const name = 'publicize';

const PublicizeSettings = () => {
	const { isLoadingModules, isChangingStatus, isModuleActive, changeStatus } =
		useModuleStatus( name );
	const { isSocialImageGeneratorAvailable } = usePublicizeConfig();

	let children = null;
	let panels = null;

	if ( isLoadingModules ) {
		children = <PublicizeSkeletonLoader />;
	} else if ( ! isModuleActive ) {
		children = (
			<PublicizePlaceholder
				changeStatus={ changeStatus }
				isModuleActive={ isModuleActive }
				isLoading={ isChangingStatus }
			/>
		);
	} else {
		children = (
			<>
				<PublicizePanel>
					<UpsellNotice />
				</PublicizePanel>
				{ isSocialImageGeneratorAvailable && <SocialImageGeneratorPanel /> }
			</>
		);
		panels = (
			<>
				<PrePublishPanels isSocialImageGeneratorAvailable={ isSocialImageGeneratorAvailable } />
				<PostPublishPanels />
			</>
		);
	}

	return (
		<PostTypeSupportCheck supportKeys="publicize">
			<JetpackPluginSidebar>{ children }</JetpackPluginSidebar>
			{ panels }
		</PostTypeSupportCheck>
	);
};

export const settings = {
	render: PublicizeSettings,
};
