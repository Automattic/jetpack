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
			default:
				// Check for URL action (navigation)
				if ( errorData.action_url && errorData.action_label ) {
					const actions = [
						<NoticeAction key="primary" href={ errorData.action_url }>
							{ errorData.action_label }
						</NoticeAction>,
					];

					// Add secondary action if available
					if ( errorData.secondary_action_url && errorData.secondary_action_label ) {
						actions.push(
							<NoticeAction
								key="secondary"
								href={ errorData.secondary_action_url }
								variant="secondary"
							>
								{ errorData.secondary_action_label }
							</NoticeAction>
						);
					}

					return (
						<SimpleNotice
							text={ message }
							status={ 'is-error' }
							icon={ 'link-break' }
							showDismiss={ false }
							display={ this.props.display }
						>
							{ actions }
						</SimpleNotice>
					);
				}

				// If no custom action available, fall back to default reconnect behavior
				return (
					<ErrorNoticeCycleConnection
						text={ message }
						errorCode={ code }
						errorData={ errorData }
						action={ 'reconnect' }
						display={ this.props.display }
					/>
				);
		}
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
