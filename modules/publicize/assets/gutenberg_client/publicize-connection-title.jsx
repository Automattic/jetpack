/**
 * Publicize connection label component for title area.
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

class PublicizeConnection extends Component {

	render() {
		const { label } = this.props;

		return (
			<span><strong>{ label } </strong></span>
		);
	}
}

export default PublicizeConnection;

