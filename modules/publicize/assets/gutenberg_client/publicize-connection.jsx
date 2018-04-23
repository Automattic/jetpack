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
const {
	FormToggle,
} = window.wp.components;

class PublicizeConnection extends Component {
	constructor( props ) {
		super( props );
		const { defaultEnabled } = props;
		this.state = {
			checked: defaultEnabled,
		};
	}

	/**
	 * Handler for when connection is enabled/disabled.
	 *
	 * Calls parent's change handler in this.prop so
	 * state change can be handled by parent.
	 *
	 * @since 5.9.1
	 */
	onConnectionChange = () => {
		const { unique_id } = this.props.connectionData;
		const { connectionChange } = this.props;
		const { checked } = this.state;
		this.setState( {
			checked: ! checked,
		} );
		connectionChange( unique_id, ! checked );
	}

	render() {
		const {
			name,
			label,
			disabled,
			display_name,
		} = this.props.connectionData;
		const { checked } = this.state;
		const isDisabled = ( '' !== disabled );
		// Genericon names are dash separated
		const socialName = name.replace( '_', '-' );

		return (
			<li>
				<div className="publicize-jetpack-connection-container">
					<label htmlFor={ label }className="jetpack-publicize-connection-label">
						<span
							title={ label }
							className={ 'jetpack-publicize-gutenberg-social-icon social-logo social-logo__' + socialName }
						>
						</span>
						<span>{ display_name }</span>
					</label>
					<FormToggle
						id={ label }
						className="jetpack-publicize-connection-toggle"
						checked={ checked }
						onChange={ this.onConnectionChange }
						disabled={ isDisabled }
					/>
				</div>
			</li>
		);
	}
}

export default PublicizeConnection;

