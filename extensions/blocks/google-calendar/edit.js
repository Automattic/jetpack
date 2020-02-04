/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './editor.scss';

class GoogleCalendarEdit extends Component {
	/**
	 * Write the block editor UI.
	 *
	 * @returns {object} The UI displayed when user edits this block.
	 */
	render() {
		return <p>{ __( 'Block edit goes here', 'jetpack' ) }</p>;
	}
}

export default GoogleCalendarEdit;
