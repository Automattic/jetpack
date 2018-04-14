/**
 * Publicize sharing form component.
 *
 * Displays text area and connection list to allow user
 * to select connections to share to and write a custom
 * sharing message. Dispatches publicize form data to
 * editor post data in format to match 'publicize' field
 * schema defined in{@see class-jetpack-publicize-gutenberg.php}
 *
 * @since  5.9.1
 */

/**
 * External dependencies
 */
import React, { Component } from 'react';
import { compose } from 'redux';

/**
 * Internal dependencies
 */
const { __ } = wp.i18n;
const {
	withSelect,
	withDispatch,
	select,
	dispatch,
} = wp.data;
import PublicizeConnection from './publicize-connection'

class PublicizeForm extends Component {
	constructor( props ) {
		super( props );
		let { connections } = this.props;
		const { initializePublicize } = this.props;
		const initialTitle = '';
		// Connection data format must match 'publicize' REST field registered in {@see class-jetpack-publicize-gutenberg.php}.
		const initialActiveConnections = connections.map( ( c ) => {
			return (
				{
					unique_id: c.unique_id,
					should_share: c.checked,
				}
			)
		} );
		initializePublicize( initialTitle,  initialActiveConnections );
	}

	/**
	 * Check to see if form should be disabled.
	 *
	 * Checks full connection list to determine if all are disabled.
	 * If they all are, it returns true to disable whole form.
	 *
	 * @since 5.9.1
	 *
	 * @return {bool} True if whole form should be disabled.
	 */
	isDisabled() {
		const { connections } = this.props;
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
		const {
			connections,
			connectionChange,
			messageChange,
			activeConnections,
			shareMessage,
		} = this.props;
		const messageLength = shareMessage.length;

		return (
			<div id="publicize" className="misc-pub-section misc-pub-section-last">
				<div id="publicize-form">
					<ul>
						{connections.map( c =>
							<PublicizeConnection
								connectionData={ c }
								key={ c.unique_id }
								defaultEnabled={ c.checked }
								connectionChange={ connectionChange }
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
						onChange={ messageChange }
						placeholder={ __( 'Publicize + Gutenberg :)' ) }
						disabled={ this.isDisabled() }
					/>
				</div>
			</div>
		);
	}
}

export default compose(
	withSelect( ( select ) => ( {
		activeConnections: ( null == select( 'core/editor' ).getEditedPostAttribute( 'publicize' ) ) ?
			[] : select( 'core/editor' ).getEditedPostAttribute( 'publicize' ).connections,
		shareMessage: ( null == select( 'core/editor' ).getEditedPostAttribute( 'publicize' ) ) ?
			'' : select( 'core/editor' ).getEditedPostAttribute( 'publicize' ).title,
	} ) ),
	withDispatch( ( dispatch, ownProps ) => ( {
		/**
		 * Directly sets post's publicize data.
		 *
		 * Sets initial values for publicize data this saved with post. Field schema defined in
		 * {@see class-jetpack-publicize-gutenberg.php}
		 *
		 * @since 5.9.1
		 *
		 * @param {string} title             String to share post with
		 * @param {array}  activeConnections Array of connection data {@see class-jetpack-publicize-gutenberg.php}
		 */
		initializePublicize( title, activeConnections ) {
			dispatch( 'core/editor' ).editPost( {
				publicize: {
					title: title,
					connections: activeConnections,
				}
			} );
		},

		/**
		 * Update state connection enable/disable state based on checkbox.
		 *
		 * Saves enable/disable value to connections property in editor
		 * in field 'publicize'.
		 *
		 * @since 5.9.1
		 *
		 * @param {string}  connectionID ID of the connection being enabled/disabled
		 * @param {boolean} checked      True of connection should be enabled, false otherwise
		 */
		connectionChange( connectionID, checked ) {
			//let publicizeData = wp.data.select( 'core/editor' ).getEditedPostAttribute( 'publicize' );
			let { activeConnections } = ownProps;
			const { shareMessage } = ownProps;
			activeConnections.forEach( (c) => {
				if ( c.unique_id === connectionID ) {
					c.should_share = checked;
				}
			} );
			dispatch( 'core/editor' ).editPost( {
				publicize: {
					title: shareMessage,
					connections: activeConnections,
				}
			} );
		},

		/**
		 * Handler for when sharing message is edited.
		 *
		 * Saves edited message to state and to the editor
		 * in field 'publicize'.
		 *
		 * @since 5.9.1
		 *
		 * @param event Change event data from textarea element.
		 */
		messageChange( event ) {
			let publicizeData = select( 'core/editor' ).getEditedPostAttribute( 'publicize' );
			let { shareMessage } = ownProps;
			const { activeConnections } = ownProps;
			shareMessage = event.target.value;
			dispatch( 'core/editor' ).editPost( {
				publicize: {
					title: shareMessage,
					connections: activeConnections,
				}
			} );
		}
	} ) ),
)( PublicizeForm );
