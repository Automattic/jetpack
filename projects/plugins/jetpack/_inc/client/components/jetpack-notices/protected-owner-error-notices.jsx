/**
 * External dependencies
 */
import restApi from '@automattic/jetpack-api';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React from 'react';
/**
 * Internal dependencies
 */
import SimpleNotice from 'components/notice';
import NoticeAction from 'components/notice/notice-action.jsx';
import analytics from 'lib/analytics';

/**
 * Protected Owner Error Notice Component
 *
 * Displays an error notice for protected owner errors,
 * with an "Enable automated fix" button that makes API calls to the local
 * wpcomsh endpoint to fix connection ownership issues permanently.
 *
 * @param {object} props - Component props.
 * @return {React.Component} Protected Owner Error Notice Component.
 */
export class ProtectedOwnerErrorNotice extends React.Component {
	constructor( props ) {
		super( props );
		this.state = {
			isFixing: false,
			error: null,
			success: false,
		};
	}

	/**
	 * Handle the fix action by calling the local REST API endpoint.
	 */
	handleFix = () => {
		this.setState( { isFixing: true, error: null } );

		// Track the attempt to fix the error
		analytics.tracks.recordEvent( 'jetpack_protected_owner_fix_attempt', {
			fix_type: 'permanent',
			error_code: this.props.errorCode,
		} );

		// Get the current user information from Initial_State
		const currentUser = window.Initial_State?.currentUser || {};
		const currentUserId = currentUser.id;
		const currentUserEmail = currentUser.email;

		if ( ! currentUserId || ! currentUserEmail ) {
			this.setState( {
				isFixing: false,
				error: __( 'Could not determine the current user information', 'jetpack' ),
			} );
			return;
		}

		// Call the local REST API endpoint
		restApi.req
			.post( {
				path: '/wpcomsh/v1/protected-owner-fix',
				body: {
					fix_type: 'permanent',
					error_code: this.props.errorCode,
					error_data: {
						...this.props.errorData,
						current_user_id: currentUserId,
						current_user_email: currentUserEmail,
					},
				},
			} )
			.then( () => {
				this.setState( { isFixing: false, success: true } );

				// Track the successful fix
				analytics.tracks.recordEvent( 'jetpack_protected_owner_fix_success', {
					fix_type: 'permanent',
					error_code: this.props.errorCode,
				} );

				// Refresh the page after a short delay to show the updated status
				setTimeout( () => {
					window.location.reload();
				}, 1500 );
			} )
			.catch( error => {
				this.setState( {
					isFixing: false,
					error:
						error.message ||
						__( 'An error occurred while trying to fix the connection', 'jetpack' ),
				} );

				// Track the failed fix
				analytics.tracks.recordEvent( 'jetpack_protected_owner_fix_error', {
					fix_type: 'permanent',
					error_code: this.props.errorCode,
					error_message: error.message,
				} );
			} );
	};

	/**
	 * Handle the create missing account action by redirecting to the WordPress user creation page.
	 */
	handleCreateMissingAccount = () => {
		// Track the attempt to create missing account
		analytics.tracks.recordEvent( 'jetpack_protected_owner_create_account_attempt', {
			error_code: this.props.errorCode,
		} );

		// Navigate to the WordPress Add New User admin page
		window.location.href = '/wp-admin/user-new.php';
	};

	render() {
		// If we're fixing, show a loading message
		if ( this.state.isFixing ) {
			return (
				<SimpleNotice
					text={ this.props.text }
					status={ 'is-info' }
					icon={ 'sync' }
					showDismiss={ false }
					display={ this.props.display }
				>
					<div className="jp-loading-message">{ __( 'Enabling automated fix…', 'jetpack' ) }</div>
				</SimpleNotice>
			);
		}

		// If there was an error, show it
		if ( this.state.error ) {
			return (
				<SimpleNotice
					text={ this.state.error }
					status={ 'is-error' }
					icon={ 'notice' }
					showDismiss={ false }
					display={ this.props.display }
				>
					<NoticeAction onClick={ this.handleFix }>{ __( 'Try Again', 'jetpack' ) }</NoticeAction>
				</SimpleNotice>
			);
		}

		// If the fix was successful, show a success message
		if ( this.state.success ) {
			return (
				<SimpleNotice
					text={ __( 'Automated fix enabled successfully! Refreshing…', 'jetpack' ) }
					status={ 'is-success' }
					icon={ 'checkmark' }
					showDismiss={ false }
					display={ this.props.display }
				/>
			);
		}

		// Default view with action buttons
		return (
			<SimpleNotice
				text={ this.props.text }
				status={ 'is-error' }
				icon={ 'link-break' }
				showDismiss={ false }
				display={ this.props.display }
			>
				<NoticeAction
					onClick={ this.handleCreateMissingAccount }
					className="jp-protected-owner-action-create"
				>
					{ __( 'Create missing account', 'jetpack' ) }
				</NoticeAction>
				<NoticeAction onClick={ this.handleFix } className="jp-protected-owner-action-enable">
					{ __( 'Enable automated fix', 'jetpack' ) }
				</NoticeAction>
			</SimpleNotice>
		);
	}
}

ProtectedOwnerErrorNotice.propTypes = {
	text: PropTypes.string.isRequired,
	errorCode: PropTypes.string,
	errorData: PropTypes.object,
	display: PropTypes.bool,
};

ProtectedOwnerErrorNotice.defaultProps = {
	text: __( 'There is an issue with the protected owner account connection.', 'jetpack' ),
	display: true,
};
