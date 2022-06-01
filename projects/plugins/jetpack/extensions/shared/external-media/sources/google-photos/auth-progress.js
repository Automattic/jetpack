import { memo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

function AuthProgress() {
	return <p>{ __( 'Awaiting authorization', 'jetpack' ) }</p>;
}

export default memo( AuthProgress );
