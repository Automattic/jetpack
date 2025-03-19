import { JetpackLogo } from '@automattic/jetpack-shared-extension-utils/icons';
import { createSlotFill } from '@wordpress/components';
import { PluginSidebar, PluginSidebarMoreMenuItem } from '@wordpress/edit-post';
import { Fragment } from '@wordpress/element';
import { registerPlugin } from '@wordpress/plugins';

import './jetpack-plugin-sidebar.scss';

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
