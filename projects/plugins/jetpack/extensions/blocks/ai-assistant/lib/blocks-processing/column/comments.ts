/**
 * External dependencies
 */
import debugFactory from 'debug';

const debug = debugFactory( 'jetpack-ai-assistant:block-processing' );

export const comments = ( block, attributes = null ) => {
	const stringifiedAttributes = JSON.stringify( attributes ?? block?.attributes ?? {} );
	const commentAttributes =
		stringifiedAttributes != null && stringifiedAttributes !== '{}'
			? ` ${ stringifiedAttributes }`
			: '';

	const open = `<!-- wp:column${ commentAttributes } -->`;
	const close = '<!-- /wp:column -->';
	debug( 'Column comment: %o', open, close );
	return { open, close };
};
