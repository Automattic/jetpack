/**
 * Top-level Publicize plugin for Gutenberg editor.
 *
 * Hooks into Gutenberg's PluginPrePublishPanel
 * to display Jetpack's Publicize UI in the pre-publish flow.
 *
 * It also hooks into our dedicated Jetpack plugin sidebar and
 * displays the Publicize UI there.
 */
import { useModuleStatus } from '@automattic/jetpack-shared-extension-utils';
import { PostTypeSupportCheck } from '@wordpress/editor';
import JetpackPluginSidebar from '../../shared/jetpack-plugin-sidebar';
import { PublicizePlaceholder } from './components/placeholder';
import PublicizeSkeletonLoader from './components/skeleton-loader';
import Settings from './settings';

import './editor.scss';

export const name = 'publicize';

const PublicizeSettings = () => {
	const { isLoadingModules, isChangingStatus, isModuleActive, changeStatus } =
		useModuleStatus( name );

	let children = null;

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
		children = <Settings />;
	}

	return (
		<PostTypeSupportCheck supportKeys="publicize">
			<JetpackPluginSidebar>{ children }</JetpackPluginSidebar>
		</PostTypeSupportCheck>
	);
};

export const settings = {
	render: PublicizeSettings,
};
