import { getProtectedOwnerCreateAccountUrl } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import { Component, Fragment } from 'react';
import SimpleNotice from 'components/notice';
import NoticeAction from 'components/notice/notice-action.jsx';
import { JETPACK_CONTACT_SUPPORT, JETPACK_CONTACT_BETA_SUPPORT } from 'constants/urls';
import ErrorNoticeCycleConnection from './error-notice-cycle-connection';

export default class JetpackConnectionErrors extends Component {
	static propTypes = {
		errors: PropTypes.array.isRequired,
		display: PropTypes.bool,
	};

	static defaultProps = {
		display: true,
	};

	getAction( action, message, code, errorData, link ) {
		switch ( action ) {
			case 'reconnect':
				return (
					<ErrorNoticeCycleConnection
						text={ message }
						errorCode={ code }
						errorData={ errorData }
						action={ action }
						display={ this.props.display }
					/>
				);
			case 'support':
				return (
					<SimpleNotice
						text={ message }
						status={ 'is-error' }
						icon={ 'link-break' }
						showDismiss={ false }
						display={ this.props.display }
					>
						<NoticeAction href={ link } external={ true }>
							{ __( 'Contact support', 'jetpack' ) }
						</NoticeAction>
					</SimpleNotice>
				);
			case 'create_missing_account': {
				// Check if this is a protected owner error with email data
				let createAccountUrl = errorData.support_url || '/wp-admin/user-new.php';

				// If we have error data that looks like a protected owner error, use prepopulation
				if ( errorData && ( errorData.email || errorData.wpcom_user_email ) ) {
					// Create a mock connection error object for the helper function
					const connectionError = {
						error_data: {
							email: errorData.email,
							wpcom_user_email: errorData.wpcom_user_email,
						},
					};

					// Get admin URL from window.Initial_State or use default
					const adminUrl =
						( typeof window !== 'undefined' && window.Initial_State?.adminUrl ) || '/wp-admin/';
					createAccountUrl = getProtectedOwnerCreateAccountUrl( connectionError, adminUrl );
				}

				return (
					<SimpleNotice
						text={ message }
						status={ 'is-error' }
						icon={ 'link-break' }
						showDismiss={ false }
						display={ this.props.display }
					>
						<NoticeAction href={ createAccountUrl }>
							{ __( 'Create Account', 'jetpack' ) }
						</NoticeAction>
					</SimpleNotice>
				);
			}
		}

		return null;
	}

	renderOne( error ) {
		const supportURl = this.props.isDevVersion
			? JETPACK_CONTACT_BETA_SUPPORT
			: JETPACK_CONTACT_SUPPORT;

		const action = this.getAction(
			error.action,
			error.message,
			error.code,
			Object.hasOwn( error, 'data' ) ? error.data : {},
			supportURl
		);

		return null === action ? null : <Fragment key={ error.action }>{ action }</Fragment>;
	}

	render() {
		const errorsToDisplay = {};
		const errors = this.props.errors.filter( error => Object.hasOwn( error, 'action' ) );

		for ( const error of errors ) {
			if ( ! Object.hasOwn( errorsToDisplay, error.action ) ) {
				errorsToDisplay[ error.action ] = error;
			}
		}

		return Object.values( errorsToDisplay ).map( error => this.renderOne( error ) );
	}
}
