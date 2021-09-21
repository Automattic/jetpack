/**
 * Publicize sharing form component.
 *
 * Displays text area and connection list to allow user
 * to select connections to share to and write a custom
 * sharing message.
 */

/**
 * External dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { uniqueId } from 'lodash';

/**
 * Internal dependencies
 */
import PublicizeConnection from '../connection';
import PublicizeSettingsButton from '../settings-button';
import MessageBoxControl from '../message-box-control';

class PublicizeFormUnwrapped extends Component {
	state = {
		hasEditedShareMessage: false,
	};

	fieldId = uniqueId( 'jetpack-publicize-message-field-' );

	/**
	 * Check to see if form should be disabled.
	 *
	 * Checks full connection list to determine if all are disabled.
	 * If they all are, it returns true to disable whole form.
	 *
	 * @returns {boolean} True if whole form should be disabled.
	 */
	isDisabled() {
		return this.props.connections.every( connection => ! connection.toggleable );
	}

	onMessageChange = message => {
		const { messageChange } = this.props;
		const hasEditedShareMessage = true;
		this.setState( { hasEditedShareMessage } );
		messageChange( message, hasEditedShareMessage );
	};

	render() {
		const { connections, toggleConnection, refreshCallback, shareMessage, maxLength } = this.props;

		return (
			<div id="publicize-form">
				<ul className="jetpack-publicize__connections-list">
					{ connections.map( ( { display_name, enabled, id, service_name, toggleable } ) => (
						<PublicizeConnection
							disabled={ ! toggleable }
							enabled={ enabled }
							key={ id }
							id={ id }
							label={ display_name }
							name={ service_name }
							toggleConnection={ toggleConnection }
						/>
					) ) }
				</ul>
				<PublicizeSettingsButton refreshCallback={ refreshCallback } />
				{ connections.some( connection => connection.enabled ) && (
					<Fragment>
						<MessageBoxControl
							message={ shareMessage }
							onChange={ this.onMessageChange }
							disabled={ this.isDisabled() }
							maxLength={ maxLength }
						/>
					</Fragment>
				) }
			</div>
		);
	}
}

export default PublicizeFormUnwrapped;
