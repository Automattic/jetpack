/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './editor.scss';

class AmazonEdit extends Component {
	/**
	 * Write the block editor UI.
	 *
	 * @returns {object} The UI displayed when user edits this block.
	 */
	render() {
		return <p>{ __( 'Coming soon', 'jetpack' ) }</p>;
	}
}

export default AmazonEdit;
