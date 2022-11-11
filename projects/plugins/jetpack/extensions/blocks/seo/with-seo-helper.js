import { compose } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';
import { get } from 'lodash';

const validate = value => {
	if ( typeof value !== 'string' ) {
		return false;
	}

	if ( value !== '' && value.trim().length === 0 ) {
		return false;
	}

	return true;
};

export const withSeoHelper = attrName =>
	compose( [
		withSelect( select => ( {
			metaValue: get( select( 'core/editor' ).getEditedPostAttribute( 'meta' ), [ attrName ], '' ),
		} ) ),
		withDispatch( dispatch => ( {
			updateMetaValue( newValue ) {
				if ( ! validate( newValue ) ) {
					return;
				}

				dispatch( 'core/editor' ).editPost( {
					meta: {
						[ attrName ]: newValue,
					},
				} );
			},
		} ) ),
	] );
