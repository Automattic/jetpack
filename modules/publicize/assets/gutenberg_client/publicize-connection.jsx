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

class PublicizeConnection extends Component {
	/**
	 * Handler for when connection is enabled/disabled.
	 *
	 * Calls parent's change handler in this.prop so
	 * state change can be handled by parent.
	 *
	 * @since 5.9.1
	 *
	 * @param {object} event Checkbox element's onchange event object.
	 */
	onConnectionChange = ( event ) => {
		const { unique_id } = this.props.connectionData;
		const { connectionChange } = this.props;
		connectionChange( unique_id, event.target.checked );
	}

	render() {
		const { name, label, disabled } = this.props.connectionData;
		const { defaultEnabled } = this.props;
		const isDisabled = ( '' !== disabled );

		return (
			<li>
				<label htmlFor={ name }>
					<input type="checkbox"
						className={ 'wpas-submit-' + name }
						id={ name }
						defaultChecked={ defaultEnabled }
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

