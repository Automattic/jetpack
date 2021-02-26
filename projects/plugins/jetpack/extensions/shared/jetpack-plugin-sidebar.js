/**
 * External dependencies
 */
import { createSlotFill } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { PluginSidebar, PluginSidebarMoreMenuItem } from '@wordpress/edit-post';
import { registerPlugin } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import './jetpack-plugin-sidebar.scss';
import { JetpackLogo } from './icons';

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
