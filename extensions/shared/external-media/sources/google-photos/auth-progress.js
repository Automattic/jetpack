/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { memo } from '@wordpress/element';

const AuthProgress = memo( function AuthProgress() {
	return <p>{ __( 'Awaiting authorization', 'jetpack' ) }</p>;
} );

export default AuthProgress;
