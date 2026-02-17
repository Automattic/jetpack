/**
 * Publicize connection form component.
 *
 * Component to display connection label and a
 * checkbox to enable/disable the connection for sharing.
 */

import { withSelect } from '@wordpress/data';
import { Component } from '@wordpress/element';
import { SOCIAL_STORE_ID } from '../../social-store';
import ConnectionToggle from '../connection-toggle';
import styles from './styles.module.scss';

class PublicizeConnection extends Component {
	onConnectionChange = () => {
		const { id } = this.props;
		if ( this.isDisabled() ) {
			return;
		}
		this.props.toggleConnection( id );
	};

	connectionIsFailing() {
		const { failedConnections, name } = this.props;
		return failedConnections.some( connection => connection.service_name === name );
	}

	isDisabled() {
		return this.props.disabled || this.connectionIsFailing();
	}

	render() {
		const { enabled, id, label, name, profilePicture } = this.props;
		const fieldId = 'connection-' + name + '-' + id;
		// Genericon names are dash separated
		const serviceName = name.replace( '_', '-' );

		const toggle = (
			<ConnectionToggle
				id={ fieldId }
				className={ styles[ 'connection-toggle' ] }
				checked={ enabled }
				onChange={ this.onConnectionChange }
				disabled={ this.isDisabled() }
				serviceName={ serviceName }
				label={ label }
				profilePicture={ profilePicture }
			/>
		);

		return (
			<li>
				<div className={ styles[ 'connection-container' ] }>{ toggle }</div>
			</li>
		);
	}
}

export default withSelect( select => ( {
	failedConnections: select( SOCIAL_STORE_ID ).getFailedConnections(),
} ) )( PublicizeConnection );
