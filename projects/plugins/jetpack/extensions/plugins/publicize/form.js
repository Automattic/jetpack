/**
 * Higher Order Publicize sharing form composition.
 *
 * Uses Gutenberg data API to dispatch publicize form data to
 * editor post data in format to match 'publicize' field schema.
 */

/**
 * External dependencies
 */
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PublicizeFormUnwrapped from './form-unwrapped';

const PublicizeForm = compose( [
	withSelect( select => {
		return {
			connections: select( 'core/editor' ).getEditedPostAttribute(
				'jetpack_publicize_connections'
			),
			shareMessage: select( 'jetpack/publicize' ).getShareMessage(),
			maxLength: select( 'jetpack/publicize' ).getShareMessageMaxLength(),
		};
	} ),
	withDispatch( ( dispatch, { connections } ) => ( {
		/**
		 * Toggle connection enable/disable state based on checkbox.
		 *
		 * Saves enable/disable value to connections property in editor
		 * in field 'jetpack_publicize_connections'.
		 *
		 * @param {number}  id - ID of the connection being enabled/disabled
		 */
		toggleConnection( id ) {
			const newConnections = connections.map( connection => ( {
				...connection,
				enabled: connection.id === id ? ! connection.enabled : connection.enabled,
			} ) );

			dispatch( 'core/editor' ).editPost( {
				jetpack_publicize_connections: newConnections,
			} );
		},

		/**
		 * Handler for when sharing message is edited.
		 *
		 * Saves edited message to state and to the editor
		 * in field 'jetpack_publicize_message'.
		 *
		 * @param {object} event                  - Change event data from textarea element.
		 * @param {boolean} hasEditedShareMessage - Whether the share message has been edited.
		 */
		messageChange( event, hasEditedShareMessage ) {
			dispatch( 'core/editor' ).editPost( {
				meta: {
					jetpack_publicize_message: event.target.value,
					jetpack_publicize_hasEditedShareMessage: hasEditedShareMessage,
				},
			} );
		},
	} ) ),
] )( PublicizeFormUnwrapped );

export default PublicizeForm;
