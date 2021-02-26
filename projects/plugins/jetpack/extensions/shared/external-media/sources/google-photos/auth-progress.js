/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { memo } from '@wordpress/element';

function AuthProgress() {
	return <p>{ __( 'Awaiting authorization', 'jetpack' ) }</p>;
}

export default memo( AuthProgress );
