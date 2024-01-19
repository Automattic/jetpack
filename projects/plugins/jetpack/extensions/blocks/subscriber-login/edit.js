import { __ } from '@wordpress/i18n';

function SubscriberLoginEdit( { className } ) {
	return (
		<div className={ className }>
			<a href="#logout-pseudo-link">{ __( 'Log out', 'jetpack' ) }</a>
		</div>
	);
}

export default SubscriberLoginEdit;
