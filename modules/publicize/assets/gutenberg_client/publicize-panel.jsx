/**
 * Publicize sharing panel component.
 *
 * Displays Publicize notifications if no
 * services are connected or displays form if
 * services are connected.
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
import { getPublicizeConnections } from './async-publicize-lib'
import PublicizeNoConnections from './publicize-no-connections'
const { PanelBody } = wp.components;
import PublicizeForm from './publicize-form'
import PublicizeConnectionVerify from './publicize-connection-verify'

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

class PublicizePanel extends Component {
	constructor( props ) {
		super( props );
		var connectionList = getPublicizeConnections();

		this.state = {
			connections: connectionList,
		}
	}

	render() {
		const { connections } = this.state;
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
				{ ( connections.length > 0 ) && <PublicizeForm connections={ connections } /> }
				{ ( connections.length > 0 ) && <PublicizeConnectionVerify /> }
				{ ( connections.length == 0 ) && <PublicizeNoConnections /> }
			</PanelBody>
		);
	}
}

export default PublicizePanel;

