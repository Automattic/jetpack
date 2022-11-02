import { compose } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';
import { get } from 'lodash';

export const withSeoHelper = attrName =>
	compose( [
		withSelect( select => ( {
			metaValue: get( select( 'core/editor' ).getEditedPostAttribute( 'meta' ), [ attrName ], '' ),
		} ) ),
		withDispatch( dispatch => ( {
			updateMetaValue( newValue ) {
				dispatch( 'core/editor' ).editPost( {
					meta: {
						[ attrName ]: newValue,
					},
				} );
			},
		} ) ),
	] );
