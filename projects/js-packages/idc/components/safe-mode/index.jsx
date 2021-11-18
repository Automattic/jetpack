/**
 * External dependencies
 */
import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { compose } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import restApi from '@automattic/jetpack-api';
import { Spinner } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import { STORE_ID } from '../../state/store';
import './style.scss';

/**
 * Render the "Stay safe" button.
 *
 * @param {Function} callback - Button click callback.
 * @param {boolean} isDisabled - Whether the button should be disabled.
 * @returns {React.Component} - The rendered output.
 */
const renderStaySafeButton = ( callback, isDisabled ) => {
	return createInterpolateElement(
		__( 'Or decide later and stay in <button>Safe mode</button>', 'jetpack' ),
		{
			button: (
				<Button
					label={ __( 'Safe mode', 'jetpack' ) }
					variant="link"
					onClick={ callback }
					disabled={ isDisabled }
				/>
			),
		}
	);
};

/**
 * Render the "staying safe" line.
 *
 * @returns {React.Component} - The rendered output.
 */
const renderStayingSafe = () => {
	return (
		<div className="jp-idc__safe-mode__staying-safe">
			<Spinner color="black" />
			<span>{ __( 'Finishing setting up Safe mode…', 'jetpack' ) }</span>
		</div>
	);
};

const SafeMode = props => {
	const { isActionInProgress, setIsActionInProgress } = props;
	const [ isStayingSafe, setIsStayingSafe ] = useState( false );

	const staySafeCallback = useCallback( () => {
		if ( ! isActionInProgress ) {
			setIsStayingSafe( true );
			setIsActionInProgress( true );

			restApi
				.confirmIDCSafeMode()
				.then( () => {
					window.location.reload();
				} )
				.catch( error => {
					setIsActionInProgress( false );
					setIsStayingSafe( false );
					throw error;
				} );
		}
	}, [ isActionInProgress, setIsActionInProgress ] );

	return (
		<div className="jp-idc__safe-mode">
			{ isStayingSafe
				? renderStayingSafe()
				: renderStaySafeButton( staySafeCallback, isActionInProgress ) }
		</div>
	);
};

SafeMode.propTypes = {
	/** Whether there's already an action in progress. */
	isActionInProgress: PropTypes.bool,
	/** Function to set the "action in progress" flag. */
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
