import { memo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React from 'react';

/**
 * AuthProgress component
 *
 * @return {React.ReactElement} - JSX Element
 */
function AuthProgress() {
	return <p>{ __( 'Awaiting authorization', 'jetpack-external-media' ) }</p>;
}

export default memo( AuthProgress );
