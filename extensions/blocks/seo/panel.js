/**
 * External dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import { get } from 'lodash';
import { withDispatch, withSelect } from '@wordpress/data';

class SeoPanel extends Component {
	onMessageChange = event => {
		this.props.updateSeoDescription( event.target.value );
	};

	render() {
		const { seoDescription } = this.props;

		return (
			<div className="jetpack-seo-message-box">
				<textarea
					value={ seoDescription }
					onChange={ this.onMessageChange }
					placeholder={ __( 'Write a description…', 'jetpack' ) }
					rows={ 4 }
				/>
				<div className="jetpack-seo-character-count">
					{ sprintf(
						_n( '%d character', '%d characters', seoDescription.length, 'jetpack' ),
						seoDescription.length
					) }
				</div>
			</div>
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
] )( SeoPanel );
