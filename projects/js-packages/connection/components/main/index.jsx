/**
 * External dependencies
 */
import React, { useEffect, useCallback, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import InPlaceConnection from '../in-place-connection';
import restApi from '../../tools/jetpack-rest-api-client';

const Main = props => {
	const [ isRegistering, setIsRegistering ] = useState( false );
	const [ isLinking, setIsLinking ] = useState( false );

	const { apiRoot, apiNonce } = props;

	useEffect( () => {
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	}, [ apiRoot, apiNonce ] );

	const linkSite = useCallback( () => {
		if ( props.useCalypsoFlow ) {
			window.location.href = props.connectUserUrl;
			return;
		}

		setIsLinking( true );
	}, [ props.connectUserUrl, props.useCalypsoFlow, setIsLinking ] );

	const onLinked = useCallback( () => {
		setIsLinking( false );
	}, [ setIsLinking ] );

	const registerSite = useCallback(
		e => {
			setIsRegistering( true );

			restApi
				.registerSite()
				.then( () => {
					setIsRegistering( false );
					linkSite();
				} )
				.catch( error => {
					throw error;
				} );

			e.preventDefault();
		},
		[ setIsRegistering, linkSite ]
	);

	return (
		<div className="jp-connection-main">
			{ ! isLinking && (
				<Button label={ props.label } onClick={ registerSite } isPrimary disabled={ isRegistering }>
					{ __( 'Connect', 'jetpack' ) }
				</Button>
			) }

			{ isLinking && (
				<InPlaceConnection
					connectUrl={ props.connectUserUrl }
					title={ props.inPlaceTitle }
					hasConnectedOwner={ props.hasConnectedOwner }
					onComplete={ onLinked }
					displayTOS={ props.hasConnectedOwner || props.isSiteRegistered }
				/>
			) }
		</div>
	);
};

Main.propTypes = {
	connectUserUrl: PropTypes.string.required,
	label: PropTypes.string,
	inPlaceTitle: PropTypes.string,
	useCalypsoFlow: PropTypes.bool,
	apiRoot: PropTypes.string.required,
	apiNonce: PropTypes.string.required,
};

Main.defaultProps = {
	inPlaceTitle: __( 'Connect your WordPress.com account', 'jetpack' ),
	useCalypsoFlow: false,
};

export default Main;
