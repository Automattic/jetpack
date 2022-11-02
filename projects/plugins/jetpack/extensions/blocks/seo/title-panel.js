import { compose } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { get } from 'lodash';
import React from 'react';
import { CountedTextArea } from './counted-textarea';

class SeoTitlePanel extends Component {
	onTitleChange = event => {
		this.props.updateSeoTitle( event.target.value );
	};

	render() {
		const { seoTitle } = this.props;
		return (
			<CountedTextArea
				value={ seoTitle }
				onChange={ this.onTitleChange }
				placeholder={ __( 'Write a title…', 'jetpack' ) }
				rows={ 2 }
			/>
		);
	}
}

export default compose( [
	withSelect( select => ( {
		seoTitle: get(
			select( 'core/editor' ).getEditedPostAttribute( 'meta' ),
			[ 'jetpack_seo_html_title' ],
			''
		),
	} ) ),
	withDispatch( dispatch => ( {
		updateSeoTitle( seoTitle ) {
			dispatch( 'core/editor' ).editPost( {
				meta: {
					jetpack_seo_html_title: seoTitle,
				},
			} );
		},
	} ) ),
] )( SeoTitlePanel );
