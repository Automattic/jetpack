import { __ } from '@wordpress/i18n';
import './editor.scss';

function SubscriberLoginEdit() {
	/**
	 * Write the block editor UI.
	 *
	 * @returns {object} The UI displayed when user edits this block.
	 */
	return (
		<div>
			<a href="#">{ __( 'Log out', 'jetpack' ) }</a>
		</div>
	);
}

export default SubscriberLoginEdit;
