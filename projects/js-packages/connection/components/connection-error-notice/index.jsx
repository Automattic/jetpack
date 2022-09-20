import { Spinner } from '@automattic/jetpack-components';
import { Notice } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, warning, info } from '@wordpress/icons';
import React from 'react';
import useRestoreConnection from '../../hooks/use-restore-connection/index.jsx';
import useConnection from '../use-connection';
import styles from './styles.module.scss';

/**
 * The RNA Connection Error Notice component.
 *
 * @returns {React.Component} The `ConnectionErrorNotice` component.
 */
const ConnectErrorNotice = () => {
	const { connectionErrors } = useConnection( {} );
	const {
		restoreConnection,
		isRestoringConnection,
		restoreConnectionError,
	} = useRestoreConnection();

	const errorRender = restoreConnectionError ? (
		<Notice
			status={ 'error' }
			isDismissible={ false }
			className={ styles.notice + ' ' + styles.error }
		>
			<Icon icon={ warning } />
			<div className={ styles.message }>
				{ sprintf(
					/* translators: placeholder is the error. */
					__( 'There was an error reconnecting Jetpack. Error: %s', 'jetpack' ),
					restoreConnectionError
				) }
			</div>
		</Notice>
	) : null;

	if ( Object.values( connectionErrors ).length && ! isRestoringConnection ) {
		const errors = Object.values( connectionErrors ).shift();

		if ( errors.length && errors[ 0 ].error_message ) {
			return (
				<>
					{ errorRender }
					<Notice status={ 'error' } isDismissible={ false } className={ styles.notice }>
						<Icon icon={ warning } />
						<div className={ styles.message }>{ errors[ 0 ].error_message }</div>
						<a onClick={ restoreConnection } className={ styles.link }>
							{ __( 'Restore Connection', 'jetpack' ) }
						</a>
					</Notice>
				</>
			);
		}
	}

	if ( isRestoringConnection ) {
		return (
			<Notice status={ 'error' } isDismissible={ false } className={ styles.notice }>
				<Icon icon={ warning } />
				<div className={ styles.message }>{ __( 'Reconnecting Jetpack', 'jetpack' ) }</div>
				<Spinner color="#B32D2E" />
			</Notice>
		);
	}

	return null;
};

export default ConnectErrorNotice;
