/**
 * External dependencies
 */
import debugFactory from 'debug';

const debug = debugFactory( 'jetpack-ai-assistant:block-processing' );

export const comments = ( block, attributes = null ) => {
	const { url, id, dimRatio, isDark } = attributes ?? block?.attributes ?? {};
	const open = `<!-- wp:cover {"url":"${ url }","id":${ id },"dimRatio":${ dimRatio },"isDark":${ isDark }} -->`;
	const close = '<!-- /wp:cover -->';
	debug( 'Cover comment: %o', open, close );
	return { open, close };
};
