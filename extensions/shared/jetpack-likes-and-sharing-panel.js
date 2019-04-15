/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { createSlotFill, PanelBody } from '@wordpress/components';

/**
 * Internal dependencies
 */
import JetpackPluginSidebar from './jetpack-plugin-sidebar';

const { Fill, Slot } = createSlotFill( 'JetpackLikesAndSharingPanel' );

const JetpackLikesAndSharingPanel = ( { children } ) => <Fill>{ children }</Fill>;

JetpackLikesAndSharingPanel.Slot = () => (
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

export default JetpackLikesAndSharingPanel;
