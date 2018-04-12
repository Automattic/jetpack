/**
 * Publicize sharing form component.
 *
 * Displays text area and connection list to allow user
 * to select connections to share to and write a custom
 * sharing message. Emulates classic editor form by
 * setting 'wpas...' post fields just like HTML form
 * would.
 *
 * {@see publicize.php/save_meta()}
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
import PublicizeConnectionTitle from './publicize-connection-title'
import PublicizeConnection from './publicize-connection'
import { getPublicizeConnections } from './async-publicize-lib'
const { PanelBody } = wp.components;

/**
 * Connection property value for if a connection should be shared.
 *
 * @since  5.9.1
 */
const CONNECTION_ENABLED = 'share';
/**
 * Connection property value for if a connection should be shared.
 *
 * @since  5.9.1
 */
const CONNECTION_DISABLED = '';

class PublicizeForm extends Component {
	constructor( props ) {
		super( props );
		var connectionList = getPublicizeConnections();

		var activeConnections = {};
		// Create properties for object where connection id the property name and 'checked' (true/false) is the value.
		for ( var key in connectionList ) {
			var connectionData = connectionList[ key ];
			activeConnections[ connectionData.unique_id ] = connectionData.checked ? CONNECTION_ENABLED : CONNECTION_DISABLED;
		}
		wp.data.dispatch( 'core/editor' ).editPost( {
			wpas: {
				'0': CONNECTION_ENABLED, // Needed for classic editor form emulation {@see publicize.php/save_meta()}
				submit: activeConnections
			}
		} );

		this.state = {
			connections: connectionList,
			shareMessage: ''
		}
	}


	/**
	 * Handler for when sharing message is edited.
	 *
	 * Saves edited message to state and to the editor
	 * as field 'wpas_title' to emulate classic editor form.
	 *
	 * @since 5.9.1
	 *
	 * @param event Change event data from textarea
	 */
	messageChange = ( event ) =>  {
		this.setState( { shareMessage: event.target.value } );
		wp.data.dispatch( 'core/editor' ).editPost( { wpas_title: event.target.value } );
	}

	/**
	 * Update state connection enable/disable state based on checkbox.
	 *
	 * Saves enable/disable value to connection object in editor
	 * as field wpas.submit[connection_id] to emulate classic editor form.
	 *
	 * @since 5.9.1
	 *
	 * @param event Change event data from textarea
	 */
	connectionChange = ( connectionID, checked ) =>  {
		var connectionActiveList = wp.data.select( 'core/editor' ).getEditedPostAttribute( 'wpas' ).submit;
		connectionActiveList[ connectionID ] = checked ? CONNECTION_ENABLED : CONNECTION_DISABLED;
		wp.data.dispatch( 'core/editor' ).editPost( { wpas: { submit: connectionActiveList } } );
	}

	/**
	 * Check to see if form should be disabled.
	 *
	 * Checks full connection list to determine if all are disabled.
	 * If they all are, it returns true to disable whole form.
	 *
	 * @since 5.9.1
	 *
	 * @return bool True if whole form should be disabled.
	 */
	isDisabled() {
		const { connections } = this.state;
		var disabled = true; // Assume all disabled

		// Check to see if at least one connection is not disabled
		for ( var key in connections ) {
			if ( '' === connections[ key ].disabled ) {
				disabled = false;
				break;
			}
		}
		return disabled;
	}


	render() {
		const { connections, shareMessage } = this.state;
		const messageLength = shareMessage.length;
		return (
			<PanelBody
				initialOpen={ true }
				id='publicize-title'
				title={
					<span id="publicize-defaults" key='publicize-title-span'>
						{ __( 'Share this post' ) }
					</span>
				 }
			>
				<div id="publicize" className="misc-pub-section misc-pub-section-last">
					<div id="publicize-form">
						<ul>
							{ connections.map( c =>
								<PublicizeConnection
									connectionData={ c }
									key={ c.unique_id }
									connectionChange={ this.connectionChange }
								/>
							) }
						</ul>
						<label htmlFor="wpas-title">{ __( 'Custom Message:' ) }</label>
						<span id="wpas-title-counter" className="alignright hide-if-no-js">
							{ messageLength }
						</span>
						<textarea
							id='jetpack-publicize-message-box'
							value={ shareMessage }
							onChange={ this.messageChange }
							placeholder={ __('Publicize + Gutenberg :)') }
							disabled={ this.isDisabled() }
						/>
					</div>

				</div>
			</PanelBody>
		);
	}
}

export default PublicizeForm;

