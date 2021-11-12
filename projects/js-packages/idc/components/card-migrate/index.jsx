/**
 * External dependencies
 */
import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Button, Dashicon } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import restApi from '@automattic/jetpack-api';
import { Spinner } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import { STORE_ID } from '../../state/store';
import extractHostname from '../../tools/extract-hostname';

/**
 * The "migrate" card.
 *
 * @param {object} props - The properties.
 * @param {string} props.wpcomHomeUrl - The original site URL.
 * @param {string} props.currentUrl - The current site URL.
 * @param {Function} props.onMigrated - The callback to be called when migration has completed.
 * @param {boolean} props.isActionInProgress - Whether there's already an action in progress.
 * @param {Function} props.setIsActionInProgress - Function to set the "action in progress" flag.
 * @returns {React.Component} The `ConnectScreen` component.
 */
const CardMigrate = props => {
	const wpcomHostName = extractHostname( props.wpcomHomeUrl );
	const currentHostName = extractHostname( props.currentUrl );

	const { isActionInProgress, setIsActionInProgress } = props;

	const { onMigrated } = props;

	const buttonLabel = __( 'Move your settings', 'jetpack' );

	const [ isMigrating, setIsMigrating ] = useState( false );

	/**
	 * Initiate the migration.
	 * Placeholder for now.
	 *
	 * @todo Add the actual migration functionality.
	 */
	const doMigrate = useCallback( () => {
		if ( ! isActionInProgress ) {
			setIsActionInProgress( true );
			setIsMigrating( true );

			restApi
				.migrateIDC()
				.then( () => {
					setIsMigrating( false );

					if ( onMigrated && {}.toString.call( onMigrated ) === '[object Function]' ) {
						onMigrated();
					}
				} )
				.catch( error => {
					setIsActionInProgress( false );
					setIsMigrating( false );
					throw error;
				} );
		}
	}, [ setIsMigrating, onMigrated, isActionInProgress, setIsActionInProgress ] );

	return (
		<div className="jp-idc__idc-screen__card-action-base">
			<div className="jp-idc__idc-screen__card-action-top">
				<h4>{ __( 'Move Jetpack data', 'jetpack' ) }</h4>

				<p>
					{ createInterpolateElement(
						sprintf(
							/* translators: %1$s: The current site domain name. %2$s: The original site domain name. */
							__(
								'Move all your settings, stats and subscribers to your other <hostname>%1$s</hostname>. <hostname>%2$s</hostname> will be disconnected from Jetpack.',
								'jetpack'
							),
							currentHostName,
							wpcomHostName
						),
						{
							hostname: <strong />,
						}
					) }
				</p>
			</div>

			<div className="jp-idc__idc-screen__card-action-bottom">
				<div className="jp-idc__idc-screen__card-action-sitename">{ wpcomHostName }</div>
				<Dashicon icon="arrow-down-alt" className="jp-idc__idc-screen__card-action-separator" />
				<div className="jp-idc__idc-screen__card-action-sitename">{ currentHostName }</div>

				<Button
					className="jp-idc__idc-screen__card-action-button"
					label={ buttonLabel }
					onClick={ doMigrate }
					disabled={ isActionInProgress }
				>
					{ isMigrating ? <Spinner /> : buttonLabel }
				</Button>
			</div>
		</div>
	);
};

CardMigrate.propTypes = {
	wpcomHomeUrl: PropTypes.string.isRequired,
	currentUrl: PropTypes.string.isRequired,
	onMigrated: PropTypes.func,
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
] )( CardMigrate );
