/**
 * External dependencies
 */
import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { compose } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import restApi from '@automattic/jetpack-api';

/**
 * Internal dependencies
 */
import { STORE_ID } from '../../state/store';
import './style.scss';

/**
 * The safe mode component.
 *
 * @param {object} props - The properties.
 * @param {boolean} props.isActionInProgress - Whether there's already an action in progress.
 * @param {Function} props.setIsActionInProgress - Function to set the "action in progress" flag.
 * @returns {React.Component} The `ConnectScreen` component.
 */
const SafeMode = props => {
	const { isActionInProgress, setIsActionInProgress } = props;

	const staySafe = useCallback( () => {
		if ( ! isActionInProgress ) {
			setIsActionInProgress( true );

			restApi
				.confirmIDCSafeMode()
				.then( () => {
					window.location.reload();
				} )
				.catch( error => {
					setIsActionInProgress( false );
					throw error;
				} );
		}
	}, [ isActionInProgress, setIsActionInProgress ] );

	return (
		<div className="jp-idc-safe-mode">
			{ createInterpolateElement(
				__( 'Or decide later and stay in <button>Safe mode</button>', 'jetpack' ),
				{
					button: (
						<Button
							label={ __( 'Safe mode', 'jetpack' ) }
							variant="link"
							onClick={ staySafe }
							disabled={ isActionInProgress }
						/>
					),
				}
			) }
		</div>
	);
};

SafeMode.propTypes = {
	isActionInProgress: PropTypes.bool,
	setIsActionInProgress: PropTypes.func.isRequired,
};

export default compose( [
	withSelect( select => {
		return {
			isActionInProgress: select( STORE_ID ).getIsActionInProgress(),
		};
	} ),
	withDispatch( dispatch => {
		return {
			setIsActionInProgress: dispatch( STORE_ID ).setIsActionInProgress,
		};
	} ),
] )( SafeMode );
