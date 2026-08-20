import { memo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * AuthProgress component
 *
 * @return {import('react').ReactElement} - JSX Element
 */
function AuthProgress() {
	return <p>{ __( 'Awaiting authorization', 'jetpack-external-media' ) }</p>;
}

export default memo( AuthProgress );
