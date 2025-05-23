/**
 * External dependencies
 */
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
 * with a "Create missing account" button that redirects users to the WordPress user creation page.
 *
 * @param {object} props - Component props.
 * @return {React.Component} Protected Owner Error Notice Component.
 */
export class ProtectedOwnerErrorNotice extends React.Component {
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
		// Default view with action button
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
