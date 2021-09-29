/**
 * WordPress dependencies
 */
import { Button, PanelRow } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function SharePostButton() {
	function onPostShareHander() {}

	return (
		<Button
			className="wp-block-publicize-share-post-button"
			isSecondary
			onClick={ onPostShareHander }
		>
			{ __( 'Share this post', 'jetpack' ) }
		</Button>
	);
}

export default function SharePostSection() {
	return (
		<PanelRow>
			<SharePostButton />
		</PanelRow>
	);
}
