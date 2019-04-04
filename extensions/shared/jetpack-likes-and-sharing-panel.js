/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { createSlotFill, PanelBody } from '@wordpress/components';

const { Fill, Slot } = createSlotFill( 'JetpackLikesAndSharingPanel' );

const JetpackLikesAndSharingPanel = ( { children } ) => <Fill>{ children }</Fill>;

JetpackLikesAndSharingPanel.Slot = () => (
	<Slot>
		{ fills => {
			if ( ! fills.length ) {
				return null;
			}

			return <PanelBody title={ __( 'Likes and Sharing', 'jetpack' ) }>{ fills }</PanelBody>;
		} }
	</Slot>
);

export default JetpackLikesAndSharingPanel;
