/**
 * Publicize no connections info component.
 *
 * Displays notification if there are no connected
 * social accounts, and includes a list of links to
 * connect specific services.
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
const { __, sprintf } = wp.i18n;
import { getAllConnections } from './async-publicize-lib'

class PublicizeNoConnections extends Component {
	constructor( props ) {
		var allConnections = getAllConnections();
		super( props );
		this.state = {
			allConnections: allConnections,
		}
	}

	render() {
		const { allConnections } = this.state;
		return (
			<div>
				<strong>{ __( 'Connect social accounts to share post: ' ) }</strong>
				<br />
				<ul className='not-connected'>
					{ allConnections.map( c =>
						<li key={ c.name }>
							<a
								className="pub-service"
							    key={ c.name }
								title={ sprintf( __( 'Connect and share your posts on %s' ), c.label ) }
								target='_blank'
								href={ c.url }
							>
								{ c.label }
							</a>
						</li>
					) }
				</ul>
			</div>
		);
	}
}

export default PublicizeNoConnections;

