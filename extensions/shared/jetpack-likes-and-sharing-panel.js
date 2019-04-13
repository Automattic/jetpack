/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { createSlotFill, PanelBody } from '@wordpress/components';
// import { addQueryArgs } from '@wordpress/url';
// import getWPAdminURL from '@wordpress/editor/utils/url';

const { Fill, Slot } = createSlotFill( 'JetpackLikesAndSharingPanel' );

const JetpackLikesAndSharingPanel = ( { children } ) => <Fill>{ children }</Fill>;

JetpackLikesAndSharingPanel.Slot = () => (
	<Slot>
		{ fills => {
			if ( ! fills.length ) {
				const sharingAdminLink = '/wp-admin/admin.php?page=jetpack#/sharing';
				// const sharingAdminLink = addQueryArgs( "/wp-admin/admin.php", { page: "jetpack#/sharing" } );
				// const sharingAdminLink = getWPAdminURL( 'admin.php', { page: 'jetpack#/sharing' } );
				return (
					<PanelBody title={ __( 'Likes and Sharing', 'jetpack' ) }>
						Visit <a href={ sharingAdminLink }>Sharing settings</a> in your Dashboard to allow
						visitors to like and share your posts.
					</PanelBody>
				);
			}

			return <PanelBody title={ __( 'Likes and Sharing', 'jetpack' ) }>{ fills }</PanelBody>;
		} }
	</Slot>
);

export default JetpackLikesAndSharingPanel;
