import { __ } from '@wordpress/i18n';
import './editor.scss';

function SubscriberLoginEdit() {
	return (
		<div>
			<a href="#logout-pseudo-link">{ __( 'Log out', 'jetpack' ) }</a>
		</div>
	);
}

export default SubscriberLoginEdit;
