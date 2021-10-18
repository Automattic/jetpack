/**
 * External dependencies
 */
import React, { useState, useCallback } from 'react';
import { createInterpolateElement } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import restApi from '@automattic/jetpack-api';

/**
 * Internal dependencies
 */
import './style.scss';

/**
 * The safe mode component.
 *
 * @returns {React.Component} The `ConnectScreen` component.
 */
const SafeMode = () => {
	const [ isStayingSafe, setIsStayingSafe ] = useState( false );

	const staySafe = useCallback( () => {
		if ( ! isStayingSafe ) {
			setIsStayingSafe( true );

			restApi
				.confirmIDCSafeMode()
				.then( () => {
					window.location.reload();
				} )
				.catch( error => {
					setIsStayingSafe( false );
					throw error;
				} );
		}
	}, [ isStayingSafe, setIsStayingSafe ] );

	return (
		<div className="jp-idc-safe-mode">
			{ createInterpolateElement(
				__( 'Or decide later and stay in <button>Safe mode</button>', 'jetpack' ),
				{
					button: (
						<Button label={ __( 'Safe mode', 'jetpack' ) } variant="link" onClick={ staySafe } />
					),
				}
			) }
		</div>
	);
};

export default SafeMode;
