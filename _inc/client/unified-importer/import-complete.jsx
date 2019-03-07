/**
 * External dependencies
 */
import React, { PureComponent } from 'react';
import { __ } from '@wordpress/i18n';

class ImportComplete extends PureComponent {
	render() {
		return (
			<div>
				<h2>{ __( 'Import WordPress' ) }</h2>

				<div>{ __( 'All done! Have fun!' ) }</div>

				<div>{ __( 'Remember to update the passwords and roles of imported users.' ) }</div>
			</div>
		);
	}
}

export default ImportComplete;
