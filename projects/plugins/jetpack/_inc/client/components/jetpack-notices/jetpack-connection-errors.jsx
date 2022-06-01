import { JETPACK_CONTACT_SUPPORT, JETPACK_CONTACT_BETA_SUPPORT } from 'constants/urls';
import { __ } from '@wordpress/i18n';
import SimpleNotice from 'components/notice';
import NoticeAction from 'components/notice/notice-action.jsx';
import PropTypes from 'prop-types';
import React from 'react';
import ErrorNoticeCycleConnection from './error-notice-cycle-connection';

export default class JetpackConnectionErrors extends React.Component {
	static propTypes = {
		errors: PropTypes.array.isRequired,
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
					/>
				);
			case 'support':
				return (
					<SimpleNotice
						text={ message }
						status={ 'is-error' }
						icon={ 'link-break' }
						showDismiss={ false }
					>
						<NoticeAction href={ link } external={ true }>
							{ __( 'Contact support', 'jetpack' ) }
						</NoticeAction>
					</SimpleNotice>
				);
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
			error.hasOwnProperty( 'data' ) ? error.data : {},
			supportURl
		);

		return null === action ? null : (
			<React.Fragment key={ error.action }>{ action }</React.Fragment>
		);
	}

	render() {
		const errorsToDisplay = {};
		const errors = this.props.errors.filter( error => error.hasOwnProperty( 'action' ) );

		for ( const error of errors ) {
			if ( ! errorsToDisplay.hasOwnProperty( error.action ) ) {
				errorsToDisplay[ error.action ] = error;
			}
		}

		return Object.values( errorsToDisplay ).map( error => this.renderOne( error ) );
	}
}
