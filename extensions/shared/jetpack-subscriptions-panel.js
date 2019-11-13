/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { createSlotFill, PanelBody } from '@wordpress/components';
import { registerPlugin } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import JetpackPluginSidebar from './jetpack-plugin-sidebar';

const { Fill, Slot } = createSlotFill( 'JetpackSubscriptionsPanel' );

export { Fill as default };

registerPlugin( 'jetpack-subscriptions-panel', {
	render() {
		return (
			<Slot>
				{ fills => {
					if ( ! fills.length ) {
						return null;
					}

					return (
						<JetpackPluginSidebar>
							<PanelBody title={ __( 'Subscriptions', 'jetpack' ) }>{ fills }</PanelBody>
						</JetpackPluginSidebar>
					);
				} }
			</Slot>
		);
	},
} );
