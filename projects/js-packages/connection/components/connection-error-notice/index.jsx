import { Spinner } from '@automattic/jetpack-components';
import { Notice } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, warning } from '@wordpress/icons';
import PropTypes from 'prop-types';
import React from 'react';
import styles from './styles.module.scss';

/**
 * The RNA Connection Error Notice component.
 *
 * @param {object} props -- The properties.
 * @returns {React.Component} The `ConnectionErrorNotice` component.
 */
const ConnectionErrorNotice = props => {
	const {
		message,
		isRestoringConnection,
		restoreConnectionCallback,
		restoreConnectionError,
	} = props;

	if ( ! message ) {
		return null;
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

	return (
		<>
			{ errorRender }
			<Notice status={ 'error' } isDismissible={ false } className={ styles.notice }>
				<Icon icon={ warning } />
				<div className={ styles.message }>{ message }</div>
				{ restoreConnectionCallback && (
					<a
						onClick={ restoreConnectionCallback }
						onKeyDown={ restoreConnectionCallback }
						className={ styles.link }
						href="#"
					>
						{ __( 'Restore Connection', 'jetpack' ) }
					</a>
				) }
			</Notice>
		</>
	);
};

ConnectionErrorNotice.propTypes = {
	/** The notice message. */
	message: PropTypes.string.isRequired,
	/** "Restore Connection" button callback. */
	restoreConnectionCallback: PropTypes.func,
	/** Whether connection restore is in progress. */
	isRestoringConnection: PropTypes.bool,
	/** The connection error text if there is one. */
	restoreConnectionError: PropTypes.string,
};

export default ConnectionErrorNotice;
