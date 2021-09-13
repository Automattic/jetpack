/**
 * Publicize connection form component.
 *
 * Component to display connection label and a
 * checkbox to enable/disable the connection for sharing.
 */

/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { Disabled, Notice, ExternalLink } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { includes } from 'lodash';

/**
 * Internal dependencies
 */
import getSiteFragment from '../../../../shared/get-site-fragment';
import PublicizeIcon from '../publicize-icon';
import { SocialServiceIcon } from '../../../../shared/icons';

class PublicizeConnection extends Component {
	/**
	 * Displays a message when a connection requires reauthentication. We used this when migrating LinkedIn API usage from v1 to v2,
	 * since the prevous OAuth1 tokens were incompatible with OAuth2.
	 *
	 * @returns {object|?null} Notice about reauthentication
	 */
	maybeDisplayLinkedInNotice = () =>
		this.connectionNeedsReauth() && (
			<Notice className="jetpack-publicize-notice" isDismissible={ false } status="error">
				<p>
					{ __(
						'Your LinkedIn connection needs to be reauthenticated ' +
							'to continue working – head to Sharing to take care of it.',
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
	connectionNeedsReauth = () => includes( this.props.mustReauthConnections, this.props.name );

	onConnectionChange = () => {
		const { id } = this.props;
		this.props.toggleConnection( id );
	};

	connectionIsFailing() {
		const { failedConnections, name } = this.props;
		return failedConnections.some( connection => connection.service_name === name );
	}

	render() {
		const { disabled, enabled, id, label, name } = this.props;
		const fieldId = 'connection-' + name + '-' + id;
		// Genericon names are dash separated
		const serviceName = name.replace( '_', '-' );

		let toggle = (
			<PublicizeIcon
				id={ fieldId }
				className="jetpack-publicize-connection-toggle"
				checked={ enabled }
				onChange={ this.onConnectionChange }
				serviceName={ serviceName }
			/>
		);

		if ( disabled || this.connectionIsFailing() || this.connectionNeedsReauth() ) {
			toggle = <Disabled>{ toggle }</Disabled>;
		}

		return (
			<li>
				{ this.maybeDisplayLinkedInNotice() }
				<div className="publicize-jetpack-connection-container">
					<label htmlFor={ fieldId } className="jetpack-publicize-connection-label">
						<SocialServiceIcon
							serviceName={ serviceName }
							className="jetpack-publicize-gutenberg-social-icon"
						/>
						<span className="jetpack-publicize-connection-label-copy">{ label }</span>
					</label>
					{ toggle }
				</div>
			</li>
		);
	}
}

export default withSelect( select => ( {
	failedConnections: select( 'jetpack/publicize' ).getFailedConnections(),
	mustReauthConnections: select( 'jetpack/publicize' ).getMustReauthConnections(),
} ) )( PublicizeConnection );
