/**
 * External dependencies
 */
import React from 'react';
import { useSelect } from '@wordpress/data';
import { JetpackConnection } from '@automattic/jetpack-connection';

/**
 * Internal dependencies
 */
import { STORE_ID } from '../../store';
import Header from '../header';
import './style.scss';

/**
 * The Connection IU Admin App.
 *
 * @returns {object} The header component.
 */
export default function Admin() {
	const APINonce = useSelect( select => select( STORE_ID ).getAPINonce(), [] );

	const APIRoot = useSelect( select => select( STORE_ID ).getAPIRoot(), [] );

	return (
		<React.Fragment>
			<Header />

			<JetpackConnection apiRoot={ APIRoot } apiNonce={ APINonce } />
		</React.Fragment>
	);
}
