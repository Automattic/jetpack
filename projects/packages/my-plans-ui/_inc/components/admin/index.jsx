/* eslint-disable no-unused-vars */
/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import { useSelect, useDispatch } from '@wordpress/data';
import { Masthead } from '@automattic/jetpack-components';

// import { ConnectionStatusCard, ConnectScreen } from '@automattic/jetpack-connection';

import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { STORE_ID } from '../../store';
import Header from '../header';
import './style.scss';
import ConnectRight from './assets/connect-right.png';

/**
 * The Connection IU Admin App.
 *
 * @returns {object} The Admin component.
 */
export default function Admin() {
	const APINonce = useSelect( select => select( STORE_ID ).getAPINonce(), [] );
	const APIRoot = useSelect( select => select( STORE_ID ).getAPIRoot(), [] );
	const assetBuildUrl = useSelect( select => select( STORE_ID ).getAssetBuildUrl(), [] );

	return (
		<React.Fragment>
			<Masthead />
			<Header />
			<h1>My Plans UI initialized</h1>
		</React.Fragment>
	);
}
