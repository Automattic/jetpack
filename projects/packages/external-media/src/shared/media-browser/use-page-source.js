import { useSelect } from '@wordpress/data';

const usePageSource = () => {
	const isEditor = useSelect( select => !! select( 'core/editor' ), [] );

	if ( isEditor ) {
		return 'editor';
	}
	return 'media-library';
};

export default usePageSource;
