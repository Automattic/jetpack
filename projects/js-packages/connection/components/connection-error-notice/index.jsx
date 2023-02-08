import { Spinner, useBreakpointMatch } from '@automattic/jetpack-components';
import { Icon, Notice, Path, SVG } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
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

	const [ isBiggerThanMedium ] = useBreakpointMatch( [ 'md' ], [ '>' ] );
	const wrapperClassName =
		styles.notice + ( isBiggerThanMedium ? ' ' + styles[ 'bigger-than-medium' ] : '' );

	const icon = (
		<Icon
			icon={
				<SVG
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<Path
						d="M11.7815 4.93772C11.8767 4.76626 12.1233 4.76626 12.2185 4.93772L20.519 19.8786C20.6116 20.0452 20.4911 20.25 20.3005 20.25H3.69951C3.50889 20.25 3.3884 20.0452 3.48098 19.8786L11.7815 4.93772Z"
						stroke="#D63638"
						strokeWidth="1.5"
					/>
					<Path d="M13 10H11V15H13V10Z" fill="#D63638" />
					<Path d="M13 16H11V18H13V16Z" fill="#D63638" />
				</SVG>
			}
		/>
	);

	if ( ! message ) {
		return null;
	}

	if ( isRestoringConnection ) {
		return (
			<Notice status={ 'error' } isDismissible={ false } className={ wrapperClassName }>
				<div className={ styles.message }>
					<Spinner color="#B32D2E" size={ 24 } />
					{ __( 'Reconnecting Jetpack', 'jetpack' ) }
				</div>
			</Notice>
		);
	}

	const errorRender = restoreConnectionError ? (
		<Notice
			status={ 'error' }
			isDismissible={ false }
			className={ wrapperClassName + ' ' + styles.error }
		>
			<div className={ styles.message }>
				{ icon }
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
			<Notice status={ 'error' } isDismissible={ false } className={ wrapperClassName }>
				<div className={ styles.message }>
					{ icon }
					{ message }
				</div>
				{ restoreConnectionCallback && (
					<a
						onClick={ restoreConnectionCallback }
						onKeyDown={ restoreConnectionCallback }
						className={ styles.button }
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
