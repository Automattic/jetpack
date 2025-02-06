import { useSelect } from '@wordpress/data';

const usePageSource = () => {
	const isSiteEditor = useSelect( select => !! select( 'core/edit-site' ), [] );
	const postType = useSelect( select => select( 'core/editor' )?.getCurrentPostType(), [] );

	if ( ! postType ) {
		return 'jetpack-external-media-import-page';
	}

	if ( isSiteEditor ) {
		return 'site-editor';
	}

	return postType === 'page' ? 'page-editor' : 'post-editor';
};

export default usePageSource;
