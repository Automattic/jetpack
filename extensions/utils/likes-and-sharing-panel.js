/**
 * External dependencies
 */
import { createSlotFill, PanelBody } from '@wordpress/components';

/**
 * Internal dependencies
 */
import JetpackPluginSidebar from '../shared/jetpack-plugin-sidebar';
import { __ } from './i18n';

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
					<PanelBody title={ __( 'Likes and Sharing' ) }>{ fills }</PanelBody>
				</JetpackPluginSidebar>
			);
		} }
	</Slot>
);

export default JetpackLikesAndSharingPanel;
