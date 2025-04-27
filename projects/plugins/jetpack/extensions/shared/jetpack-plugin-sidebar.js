import { JetpackLogo } from '@automattic/jetpack-shared-extension-utils/icons';
import { createSlotFill } from '@wordpress/components';
import {
	PluginSidebar as DeprecatedPluginSidebar,
	PluginSidebarMoreMenuItem as DeprecatedPluginSidebarMoreMenuItem,
} from '@wordpress/edit-post';
import {
	PluginSidebar as EditorPluginSidebar,
	PluginSidebarMoreMenuItem as EditorPluginSidebarMoreMenuItem,
} from '@wordpress/editor';
import { Fragment } from '@wordpress/element';
import { registerPlugin } from '@wordpress/plugins';

import './jetpack-plugin-sidebar.scss';

const PluginSidebar = EditorPluginSidebar || DeprecatedPluginSidebar;
const PluginSidebarMoreMenuItem =
	EditorPluginSidebarMoreMenuItem || DeprecatedPluginSidebarMoreMenuItem;

const { Fill, Slot } = createSlotFill( 'JetpackPluginSidebar' );

export { Fill as default };

registerPlugin( 'jetpack-sidebar', {
	render: () => (
		<Slot>
			{ fills => {
				if ( ! fills.length ) {
					return null;
				}

				return (
					<Fragment>
						<PluginSidebarMoreMenuItem target="jetpack" icon={ <JetpackLogo /> }>
							Jetpack
						</PluginSidebarMoreMenuItem>
						<PluginSidebar name="jetpack" title="Jetpack" icon={ <JetpackLogo /> }>
							{ fills }
						</PluginSidebar>
					</Fragment>
				);
			} }
		</Slot>
	),
} );
