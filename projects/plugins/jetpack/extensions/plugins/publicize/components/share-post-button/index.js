/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function SharePostButton() {
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
