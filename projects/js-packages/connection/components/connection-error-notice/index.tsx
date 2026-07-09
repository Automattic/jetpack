import { Icon, Notice, Path, SVG, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import { getReconnectErrorMessage } from '../../helpers/get-reconnect-error-message';
import styles from './styles.module.scss';
import type { ConnectionErrorNoticeProps } from './types';

const ConnectionErrorNotice = ( {
	message,
	context,
	isRestoringConnection,
	restoreConnectionCallback,
	restoreConnectionError,
	actions = [],
}: ConnectionErrorNoticeProps ) => {
	const wrapperClassName = styles.notice;

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
					<Spinner />
					{ __( 'Reconnecting Jetpack', 'jetpack-connection-js' ) }
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
				{ getReconnectErrorMessage( restoreConnectionError ) }
			</div>
		</Notice>
	) : null;

	// Determine which actions to show
	let actionButtons = [];

	if ( actions.length > 0 ) {
		// Use custom actions
		actionButtons = actions.map( ( action, index ) => {
			let buttonClassName = styles.button;
			if ( action.variant === 'primary' ) {
				buttonClassName += ' ' + styles.primary;
			} else if ( action.variant === 'secondary' ) {
				buttonClassName += ' ' + styles.secondary;
			}

			return (
				<button
					key={ index }
					type="button"
					onClick={ action.onClick }
					onKeyDown={ action.onClick }
					className={ buttonClassName }
					disabled={ action.isLoading }
				>
					{ action.isLoading
						? action.loadingText || __( 'Loading…', 'jetpack-connection-js' )
						: action.label }
				</button>
			);
		} );
	} else if ( restoreConnectionCallback ) {
		// Use default restore connection action for backward compatibility
		actionButtons = [
			<button
				key="restore"
				type="button"
				onClick={ restoreConnectionCallback }
				onKeyDown={ restoreConnectionCallback }
				className={ styles.button }
			>
				{ __( 'Restore Connection', 'jetpack-connection-js' ) }
			</button>,
		];
	}

	return (
		<>
			{ errorRender }
			<Notice status={ 'error' } isDismissible={ false } className={ wrapperClassName }>
				<div className={ styles.message }>
					{ icon }
					<div className={ styles.body }>
						{ context && <span className={ styles.context }>{ context }</span> }
						{ message }
					</div>
				</div>
				{ actionButtons.length > 0 && <div className={ styles.actions }>{ actionButtons }</div> }
			</Notice>
		</>
	);
};

ConnectionErrorNotice.propTypes = {
	/** The notice message. */
	message: PropTypes.oneOfType( [ PropTypes.string, PropTypes.element ] ).isRequired,
	/** Optional feature-supplied context line rendered above the message. */
	context: PropTypes.oneOfType( [ PropTypes.string, PropTypes.element ] ),
	/** "Restore Connection" button callback. */
	restoreConnectionCallback: PropTypes.func,
	/** Whether connection restore is in progress. */
	isRestoringConnection: PropTypes.bool,
	/** The connection error text if there is one. */
	restoreConnectionError: PropTypes.string,
	/** Array of custom action objects. */
	actions: PropTypes.arrayOf(
		PropTypes.shape( {
			label: PropTypes.string.isRequired,
			onClick: PropTypes.func.isRequired,
			isLoading: PropTypes.bool,
			loadingText: PropTypes.string,
			variant: PropTypes.oneOf( [ 'primary', 'secondary' ] ),
		} )
	),
};

export default ConnectionErrorNotice;
