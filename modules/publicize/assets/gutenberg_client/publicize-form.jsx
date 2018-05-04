/**
 * Publicize sharing form component.
 *
 * Displays text area and connection list to allow user
 * to select connections to share to and write a custom
 * sharing message. Dispatches publicize form data to
 * editor post data in format to match 'publicize' field
 * schema defined in {@see class-jetpack-publicize-gutenberg.php}
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
const { __, _n, sprintf } = window.wp.i18n;
const {
	withSelect,
	withDispatch,
} = window.wp.data;
import PublicizeConnection from './publicize-connection';
import PublicizeSettingsButton from './publicize-settings-button';

class PublicizeForm extends Component {
	constructor( props ) {
		super( props );
		const { initializePublicize, staticConnections } = this.props;
		const initialTitle = '';
		// Connection data format must match 'publicize' REST field registered in {@see class-jetpack-publicize-gutenberg.php}.
		const initialActiveConnections = staticConnections.map( ( c ) => {
			return ( {
				unique_id: c.unique_id,
				should_share: c.checked,
			} );
		} );
		initializePublicize( initialTitle, initialActiveConnections );
	}

	/**
	 * Check to see if form should be disabled.
	 *
	 * Checks full connection list to determine if all are disabled.
	 * If they all are, it returns true to disable whole form.
	 *
	 * @since 5.9.1
	 *
	 * @return {boolean} True if whole form should be disabled.
	 */
	isDisabled() {
		const { staticConnections } = this.props;
		let disabled = true; // Assume all disabled

		// Check to see if at least one connection is not disabled
		for ( const c of staticConnections ) {
			if ( ! c.disabled ) {
				disabled = false;
				break;
			}
		}
		return disabled;
	}

	/**
	 * Checks if a connection is turned on/off.
	 *
	 * Looks up connection by ID in activeConnections prop which is
	 * an array of objects with properties 'unique_id' and 'should_share';
	 * looks for an array entry with a 'unique_id' property that matches
	 * the parameter value. If found, the connection 'should_share' value
	 * is returned.
	 *
	 * @since 5.9.1
	 *
	 * @param {string} uniqueId Connection ID.
	 * @return {boolean} True if the connection is currently switched on.
	 */
	isConnectionOn( uniqueId ) {
		const { activeConnections } = this.props;
		const matchingConnection = activeConnections.find( c => uniqueId === c.unique_id );
		if ( null == matchingConnection ) {
			return false;
		}
		return matchingConnection.should_share;
	}

	render() {
		const {
			staticConnections,
			connectionChange,
			messageChange,
			shareMessage,
			refreshCallback,
		} = this.props;
		const MAXIMUM_MESSAGE_LENGTH = 256;
		const charactersRemaining = MAXIMUM_MESSAGE_LENGTH - shareMessage.length;
		let characterCountClass = 'jetpack-publicize-character-count';
		// Highlight count if there's no more room.
		if ( charactersRemaining <= 0 ) {
			characterCountClass += ' wpas-twitter-length-limit';
		}

		return (
			<div className="misc-pub-section misc-pub-section-last">
				<div id="publicize-form">
					<ul>
						{staticConnections.map( c =>
							<PublicizeConnection
								connectionData={ c }
								key={ c.unique_id }
								connectionOn={ this.isConnectionOn( c.unique_id ) }
								connectionChange={ connectionChange }
							/>
						) }
					</ul>
					<PublicizeSettingsButton refreshCallback={ refreshCallback } />
					<label className="jetpack-publicize-message-note" htmlFor="wpas-title">
						{ __( 'Customize your message' ) }
					</label>
					<div className="jetpack-publicize-message-box">
						<textarea
							value={ shareMessage }
							onChange={ messageChange }
							placeholder={ __( 'Publicize + Gutenberg :)' ) }
							disabled={ this.isDisabled() }
							maxLength={ MAXIMUM_MESSAGE_LENGTH }
						/>
						<div className={ characterCountClass }>
							{ sprintf( _n( '%d character remaining', '%d characters remaining', charactersRemaining ), charactersRemaining ) }
						</div>
					</div>
				</div>
			</div>
		);
	}
}

export default compose(
	withSelect( ( select ) => ( {
		activeConnections: ( null == select( 'core/editor' ).getEditedPostAttribute( 'publicize' ) )
			? [] : select( 'core/editor' ).getEditedPostAttribute( 'publicize' ).connections,
		shareMessage: ( null == select( 'core/editor' ).getEditedPostAttribute( 'publicize' ) )
			? '' : select( 'core/editor' ).getEditedPostAttribute( 'publicize' ).title,
	} ) ),
	withDispatch( ( dispatch, ownProps ) => ( {
		/**
		 * Directly sets post's publicize data.
		 *
		 * Sets initial values for publicize data this saved with post. Field schema defined in
		 * {@see class-jetpack-publicize-gutenberg.php}. Input parameters are used as defaults.
		 * They will be ignored if the 'publicize' field has already been set. This prevents
		 * user changes from being erased every time pre-publish panel is opened and closed.
		 *
		 * @since 5.9.1
		 *
		 * @param {string} initTitle             String to share post with
		 * @param {array}  initActiveConnections Array of connection data {@see class-jetpack-publicize-gutenberg.php}
		 */
		initializePublicize( initTitle, initActiveConnections ) {
			const {
				activeConnections,
				shareMessage,
			} = ownProps;
			const newConnections = ( activeConnections.length > 0 ) ? activeConnections : initActiveConnections;
			const newTitle = ( shareMessage.length > 0 ) ? shareMessage : initTitle;
			dispatch( 'core/editor' ).editPost( {
				publicize: {
					title: newTitle,
					connections: newConnections,
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
		 * @param {Object}  options              Top-level options parameter
		 * @param {string}  options.connectionID ID of the connection being enabled/disabled
		 * @param {boolean} options.shouldShare  True of connection should be shared to, false otherwise
		 */
		connectionChange( options ) {
			const { connectionID, shouldShare } = options;
			const { activeConnections, shareMessage } = ownProps;
			// Copy array (simply mutating data would cause the component to not be updated).
			const newConnections = activeConnections.slice( 0 );
			newConnections.forEach( ( c ) => {
				if ( c.unique_id === connectionID ) {
					c.should_share = shouldShare;
				}
			} );
			dispatch( 'core/editor' ).editPost( {
				publicize: {
					title: shareMessage,
					connections: newConnections,
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
		 * @param {object} event Change event data from textarea element.
		 */
		messageChange( event ) {
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
