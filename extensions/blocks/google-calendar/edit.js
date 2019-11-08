/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';

class GoogleCalendarEdit extends Component {
	/**
	 * Render a preview of the Google Calendar embed.
	 *
	 * @returns {object} The UI displayed when user edits this block.
	 */
	render() {
		return <p>{ __( 'Block edit goes here', 'jetpack' ) }</p>;
	}
}

export default GoogleCalendarEdit;
