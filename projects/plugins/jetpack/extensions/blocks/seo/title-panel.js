import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React from 'react';
import { CountedTextArea } from './counted-textarea';
import { withSeoHelper } from './with-seo-helper';

class SeoTitlePanel extends Component {
	onTitleChange = value => {
		this.props.updateMetaValue( value );
	};

	render() {
		const { metaValue } = this.props;
		return (
			<CountedTextArea
				value={ metaValue }
				onChange={ this.onTitleChange }
				label={ __( 'SEO Title', 'jetpack' ) }
				placeholder={ __( 'Write a title…', 'jetpack' ) }
				suggestedLimit={ 70 }
				rows={ 2 }
			/>
		);
	}
}

export default withSeoHelper( 'jetpack_seo_html_title' )( SeoTitlePanel );
