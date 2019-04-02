/**
 * External dependencies
 */
import { createSlotFill, PanelBody } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { __ } from '../utils/i18n';

const { Fill, Slot } = createSlotFill( 'JetpackLikesAndSharingPanel' );

const JetpackLikesAndSharingPanel = ( { children } ) => <Fill>{ children }</Fill>;

JetpackLikesAndSharingPanel.Slot = () => (
	<Slot>
		{ fills => {
			if ( ! fills.length ) {
				return null;
			}

			return (
				<PanelBody title={ __( 'Likes and Sharing' ) }>
					{ fills }
				</PanelBody>
			);
		} }
	</Slot>
);

export default JetpackLikesAndSharingPanel;
