/**
 * External dependencies
 */
import { createSlotFill } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { PluginSidebar, PluginSidebarMoreMenuItem } from '@wordpress/edit-post';
import { registerPlugin } from '@wordpress/plugins';
import { dispatch } from '@wordpress/data';
import { getQueryArg } from '@wordpress/url';

/**
 * Internal dependencies
 */
import './jetpack-plugin-sidebar.scss';
import { JetpackLogo } from './icons';

const { Fill, Slot } = createSlotFill( 'JetpackPluginSidebar' );

export { Fill as default };

/**
 * Open Jetpack plugin sidebar by default when URL includes jetpackSidebarIsOpen=true.
 */
function openJetpackSidebar() {
	if ( getQueryArg( window.location.search, 'jetpackSidebarIsOpen' ) !== 'true' ) {
		return;
	}

	dispatch( 'core/interface' ).enableComplementaryArea(
		'core/edit-post',
		'jetpack-sidebar/jetpack'
	);
}
openJetpackSidebar();

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
