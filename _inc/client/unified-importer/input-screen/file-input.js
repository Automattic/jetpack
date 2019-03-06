/**
 * External dependencies
 */
import React, { Fragment, PureComponent } from 'react';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';

class FileInput extends PureComponent {
	constructor( props ) {
		super( props );
		this.fileInput = React.createRef();
	}

	onChange = () => {
		this.fileInput.current && this.props.onFileSelected( this.fileInput.current.files );
	};

	onClick = () => {
		this.fileInput.current && this.fileInput.current.click();
	};

	render() {
		return (
			<Fragment>
				<input
					onChange={ this.onChange }
					ref={ this.fileInput }
					style={ { display: 'none' } }
					type="file"
				/>
				<Button
					className="wordpress-importer__file-select-button"
					isDefault
					onClick={ this.onClick }
				>
					{ this.props.children }
				</Button>
			</Fragment>
		);
	}
}

export default FileInput;
