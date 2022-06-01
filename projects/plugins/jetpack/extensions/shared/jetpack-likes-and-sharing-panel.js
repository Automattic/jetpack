import { createSlotFill, PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { registerPlugin } from '@wordpress/plugins';
import JetpackPluginSidebar from './jetpack-plugin-sidebar';

const { Fill, Slot } = createSlotFill( 'JetpackLikesAndSharingPanel' );

export { Fill as default };

registerPlugin( 'jetpack-likes-and-sharing-panel', {
	render() {
		return (
			<Slot>
				{ fills => {
					if ( ! fills.length ) {
						return null;
					}

					return (
						<JetpackPluginSidebar>
							<PanelBody title={ __( 'Likes and Sharing', 'jetpack' ) }>{ fills }</PanelBody>
						</JetpackPluginSidebar>
					);
				} }
			</Slot>
		);
	},
} );
