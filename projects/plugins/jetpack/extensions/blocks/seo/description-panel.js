import { compose } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { get } from 'lodash';
import { CountedTextArea } from './counted-textarea';

class SeoDescriptionPanel extends Component {
	onMessageChange = event => {
		this.props.updateSeoDescription( event.target.value );
	};

	render() {
		const { seoDescription } = this.props;

		return (
			<CountedTextArea
				value={ seoDescription }
				onChange={ this.onMessageChange }
				placeholder={ __( 'Write a description…', 'jetpack' ) }
				rows={ 4 }
			/>
		);
	}
}

export default compose( [
	withSelect( select => ( {
		seoDescription: get(
			select( 'core/editor' ).getEditedPostAttribute( 'meta' ),
			[ 'advanced_seo_description' ],
			''
		),
	} ) ),
	withDispatch( dispatch => ( {
		updateSeoDescription( seoDescription ) {
			dispatch( 'core/editor' ).editPost( {
				meta: {
					advanced_seo_description: seoDescription,
				},
			} );
		},
	} ) ),
] )( SeoDescriptionPanel );
