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
import { Settings } from './settings';

import './editor.scss';

export const name = 'publicize';

const PublicizeSettings = () => {
	const { isLoadingModules, isChangingStatus, isModuleActive, changeStatus } =
		useModuleStatus( name );

	if ( isLoadingModules ) {
		return (
			<PostTypeSupportCheck supportKeys="publicize">
				<JetpackPluginSidebar>
					<PublicizeSkeletonLoader />
				</JetpackPluginSidebar>
			</PostTypeSupportCheck>
		);
	}

	if ( ! isModuleActive ) {
		return (
			<PostTypeSupportCheck supportKeys="publicize">
				<JetpackPluginSidebar>
					<PublicizePlaceholder
						changeStatus={ changeStatus }
						isModuleActive={ isModuleActive }
						isLoading={ isChangingStatus }
					/>
				</JetpackPluginSidebar>
			</PostTypeSupportCheck>
		);
	}

	return <Settings />;
};

export const settings = {
	render: PublicizeSettings,
};
