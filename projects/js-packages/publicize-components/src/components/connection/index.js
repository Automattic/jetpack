/**
 * Publicize connection form component.
 *
 * Component to display connection label and a
 * checkbox to enable/disable the connection for sharing.
 */

import { getSiteFragment } from '@automattic/jetpack-shared-extension-utils';
import { Notice, ExternalLink } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { SOCIAL_STORE_ID } from '../../social-store';
import ConnectionToggle from '../connection-toggle';
import componentStyles from '../styles.module.scss';
import styles from './styles.module.scss';

class PublicizeConnection extends Component {
	/**
	 * Displays a message when a connection requires reauthentication. We used this when migrating LinkedIn API usage from v1 to v2,
	 * since the prevous OAuth1 tokens were incompatible with OAuth2.
	 *
	 * @returns {object|?null} Notice about reauthentication
	 */
	maybeDisplayLinkedInNotice = () =>
		this.connectionNeedsReauth() && (
			<Notice
				className={ componentStyles[ 'publicize-notice' ] }
				isDismissible={ false }
				status="error"
			>
				<p>
					{ __(
						'Your LinkedIn connection needs to be reauthenticated to continue working – head to Sharing to take care of it.',
						'jetpack'
					) }
				</p>
				<ExternalLink href={ `https://wordpress.com/marketing/connections/${ getSiteFragment() }` }>
					{ __( 'Go to Sharing settings', 'jetpack' ) }
				</ExternalLink>
			</Notice>
		);

	/**
	 * Check whether the connection needs to be reauthenticated.
	 *
	 * @returns {boolean} True if connection must be reauthenticated.
	 */
	connectionNeedsReauth = () => this.props.mustReauthConnections.includes( this.props.name );

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
		return this.props.disabled || this.connectionIsFailing() || this.connectionNeedsReauth();
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
				{ this.maybeDisplayLinkedInNotice() }
				<div className={ styles[ 'connection-container' ] }>{ toggle }</div>
			</li>
		);
	}
}

export default withSelect( select => ( {
	failedConnections: select( SOCIAL_STORE_ID ).getFailedConnections(),
	mustReauthConnections: select( SOCIAL_STORE_ID ).getMustReauthConnections(),
} ) )( PublicizeConnection );
