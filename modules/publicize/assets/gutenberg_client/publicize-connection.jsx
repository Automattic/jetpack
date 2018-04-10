/**
 * Publicize connection form component.
 *
 * Component to display connection label and a
 * checkbox to enable/disable the connection for sharing.
 *
 * @since  5.9.1
 */

/**
 * External dependencies
 */
import React, { Component } from 'react';

/**
 * Internal dependencies
 */
const { __ } = wp.i18n;

class PublicizeConnection extends Component {
	/**
	 * Handler for when connection is enabled/disabled.
	 *
	 * Calls parent's change handler in this.prop so
	 * state change can be handled by parent.
	 *
	 * @since 5.9.1
	 */
	onConnectionChange = ( event ) =>  {
		const { unique_id } = this.props.connectionData;
		const { connectionChange } = this.props;
		connectionChange(unique_id, event.target.checked );
	}

	render() {
		const { name, checked, label, disabled } = this.props.connectionData;
		const isDisabled = ( '' !== disabled );

		return (
			<li>
				<label>
					<input type="checkbox"
					       className={ 'wpas-submit-' + name }
					       defaultChecked={ checked }
					       onChange={ this.onConnectionChange }
					       disabled={ isDisabled }
					/>
					{ label }
				</label>
			</li>
		);
	}
}

export default PublicizeConnection;

