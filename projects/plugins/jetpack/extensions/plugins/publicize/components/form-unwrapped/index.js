/**
 * Publicize sharing form component.
 *
 * Displays text area and connection list to allow user
 * to select connections to share to and write a custom
 * sharing message.
 */

/**
 * External dependencies
 */
import classnames from 'classnames';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import { TextareaControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import PublicizeConnection from '../connection';
import PublicizeSettingsButton from '../settings-button';

function PublicizeFormUnwrapped( {
	connections,
	toggleConnection,
	refreshCallback,
	shareMessage,
	maxLength,
	onMessageChange,
} ) {
	/**
	 * Check to see if form should be disabled.
	 *
	 * Checks full connection list to determine if all are disabled.
	 * If they all are, it returns true to disable whole form.
	 *
	 * @returns {boolean} True if whole form should be disabled.
	 */
	function isDisabled() {
		return connections.every( connection => ! connection.toggleable );
	}

	const charactersRemaining = maxLength - shareMessage.length;
	const characterCountClass = classnames( 'jetpack-publicize-character-count', {
		'wpas-twitter-length-limit': charactersRemaining <= 0,
	} );

	return (
		<div id="publicize-form">
			<ul className="jetpack-publicize__connections-list">
				{ connections.map( ( { display_name, enabled, id, service_name, toggleable } ) => (
					<PublicizeConnection
						disabled={ ! toggleable }
						enabled={ enabled }
						key={ id }
						id={ id }
						label={ display_name }
						name={ service_name }
						toggleConnection={ toggleConnection }
					/>
				) ) }
			</ul>

			<PublicizeSettingsButton refreshCallback={ refreshCallback } />

			{ connections.some( connection => connection.enabled ) && (
				<Fragment>
					<div className="jetpack-publicize-message-box">
						<TextareaControl
							value={ shareMessage }
							onChange={ onMessageChange }
							disabled={ isDisabled() }
							maxLength={ maxLength }
							placeholder={ __( 'Write a message for your audience here.', 'jetpack' ) }
							rows={ 4 }
						/>
						<div className={ characterCountClass }>
							{ sprintf(
								/* translators: placeholder is a number. */
								_n(
									'%d character remaining',
									'%d characters remaining',
									charactersRemaining,
									'jetpack'
								),
								charactersRemaining
							) }
						</div>
					</div>
				</Fragment>
			) }
		</div>
	);
}

export default PublicizeFormUnwrapped;
