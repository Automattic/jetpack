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
 * Protected Owner Self Heal Notice Component
 *
 * Displays an error notice for self-healing protected owner errors,
 * with a "Create Missing User Account" button.
 *
 * @param {object} props - Component props.
 * @return {React.Component} Protected Owner Self Heal Notice Component.
 */
export class ProtectedOwnerSelfHealNotice extends React.Component {
	/**
	 * Navigate to the WordPress Add New User admin page.
	 * This helps create the missing protected owner account.
	 */
	handleClick = () => {
		// Open WordPress Add New User page
		window.location.href = window.Initial_State.adminUrl + 'user-new.php';
	};

	render() {
		return (
			<SimpleNotice
				text={ this.props.text }
				status={ 'is-error' }
				icon={ 'link-break' }
				showDismiss={ false }
				display={ this.props.display }
			>
				<NoticeAction onClick={ this.handleClick }>
					{ __( 'Create Missing User Account', 'jetpack' ) }
				</NoticeAction>
			</SimpleNotice>
		);
	}
}

ProtectedOwnerSelfHealNotice.propTypes = {
	text: PropTypes.string.isRequired,
	errorCode: PropTypes.string,
	errorData: PropTypes.object,
	display: PropTypes.bool,
};

ProtectedOwnerSelfHealNotice.defaultProps = {
	text: __( 'WordPress.com detected that the owner account is missing.', 'jetpack' ),
	display: true,
};

/**
 * Protected Owner Error Notice Component
 *
 * Displays an error notice for protected owner mismatch errors,
 * with "Fix Once" and "Fix Always" buttons that make API calls to WordPress.com
 * to fix connection ownership issues.
 *
 * @param {object} props - Component props.
 * @return {React.Component} Protected Owner Error Notice Component.
 */
export class ProtectedOwnerErrorNotice extends React.Component {
	constructor( props ) {
		super( props );
		this.state = {
			isFixing: false,
			fixingType: null,
			error: null,
			success: false,
		};
	}

	/**
	 * Handle the fix action by calling WordPress.com endpoint.
	 *
	 * @param {string} fixType - The type of fix: 'once' or 'permanent'
	 */
	handleFix = fixType => {
		this.setState( { isFixing: true, fixingType: fixType, error: null } );

		// Track the attempt to fix the error
		analytics.tracks.recordEvent( 'jetpack_protected_owner_fix_attempt', {
			fix_type: fixType,
			error_code: this.props.errorCode,
		} );

		// Get the blog ID from the initial state
		const blogId = window.Initial_State?.siteConnectionData?.blogId;
		if ( ! blogId ) {
			this.setState( {
				isFixing: false,
				error: __( 'Could not determine the site ID', 'jetpack' ),
			} );
			return;
		}

		// Call the WordPress.com endpoint
		restApi.req
			.post( {
				// This is a WordPress.com API request rather than a local REST API request
				path: `https://public-api.wordpress.com/wpcom/v2/sites/${ blogId }/jetpack-protected-connection`,
				body: {
					fix_type: fixType,
					error_code: this.props.errorCode,
					error_data: this.props.errorData,
				},
			} )
			.then( () => {
				this.setState( { isFixing: false, success: true } );

				// Track the successful fix
				analytics.tracks.recordEvent( 'jetpack_protected_owner_fix_success', {
					fix_type: fixType,
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
					fix_type: fixType,
					error_code: this.props.errorCode,
					error_message: error.message,
				} );
			} );
	};

	/**
	 * Handle click on the Fix Once button
	 */
	handleFixOnce = () => {
		this.handleFix( 'once' );
	};

	/**
	 * Handle click on the Fix Always button
	 */
	handleFixAlways = () => {
		this.handleFix( 'permanent' );
	};

	render() {
		// If we're fixing, show a loading message
		if ( this.state.isFixing ) {
			const actionText =
				this.state.fixingType === 'once'
					? __( 'Fixing connection (once)…', 'jetpack' )
					: __( 'Fixing connection (always)…', 'jetpack' );

			return (
				<SimpleNotice
					text={ this.props.text }
					status={ 'is-info' }
					icon={ 'sync' }
					showDismiss={ false }
					display={ this.props.display }
				>
					<div className="jp-loading-message">{ actionText }</div>
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
					<NoticeAction onClick={ this.handleFixOnce }>
						{ __( 'Try Again', 'jetpack' ) }
					</NoticeAction>
				</SimpleNotice>
			);
		}

		// If the fix was successful, show a success message
		if ( this.state.success ) {
			return (
				<SimpleNotice
					text={ __( 'Connection fixed successfully! Refreshing…', 'jetpack' ) }
					status={ 'is-success' }
					icon={ 'checkmark' }
					showDismiss={ false }
					display={ this.props.display }
				/>
			);
		}

		// Default view with both action buttons
		return (
			<SimpleNotice
				text={ this.props.text }
				status={ 'is-error' }
				icon={ 'link-break' }
				showDismiss={ false }
				display={ this.props.display }
			>
				<div className="jp-protected-owner-actions">
					<NoticeAction onClick={ this.handleFixOnce } className="jp-protected-owner-action-once">
						{ __( 'Fix Once', 'jetpack' ) }
					</NoticeAction>
					<NoticeAction
						onClick={ this.handleFixAlways }
						className="jp-protected-owner-action-always"
					>
						{ __( 'Fix Always', 'jetpack' ) }
					</NoticeAction>
				</div>
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
