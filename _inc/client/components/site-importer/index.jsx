/**
 * External dependencies
 */
import React, { PureComponent } from 'react';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import map from 'lodash/map';

class SiteImporter extends PureComponent {
	fileInput = {};

	state = {
		files: [],
	};

	setFileInputRef = element => {
		this.fileInput = element;
	};

	onSubmit = ( event ) => {
		event.preventDefault();
		this.setState( {
			files: get( this.fileInput, 'files', [] ),
		} );
	};

	renderFilePicker = () => {
		return <div>
			hola mundo
			<br />
			<form onSubmit={ this.onSubmit } >
				<input ref={ this.setFileInputRef } type="file" />
				<button type="submit">Upload</button>
			</form>
		</div>;
	}

	render() {
		const { active } = this.props;
		const { files } = this.state;

		if ( ! active ) {
			return false;
		}

		if ( isEmpty( files ) ) {
			return this.renderFilePicker();
		}

		return <div>
			Uploading:
			<ul>
				{ map( files, file => file.name && <li>{ file.name }</li> ) }
			</ul>
		</div>;
	}
}

export default SiteImporter;
