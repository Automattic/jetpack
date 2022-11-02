import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React from 'react';
import { CountedTextArea } from './counted-textarea';
import { withSeoHelper } from './with-seo-helper';

class SeoTitlePanel extends Component {
	onTitleChange = event => {
		this.props.updateMetaValue( event.target.value );
	};

	render() {
		const { metaValue } = this.props;
		return (
			<CountedTextArea
				value={ metaValue }
				onChange={ this.onTitleChange }
				placeholder={ __( 'Write a title…', 'jetpack' ) }
				rows={ 2 }
			/>
		);
	}
}

export default withSeoHelper( 'jetpack_seo_html_title' )( SeoTitlePanel );
