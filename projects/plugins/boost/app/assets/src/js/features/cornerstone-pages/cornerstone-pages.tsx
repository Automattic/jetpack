import { __, _n, sprintf } from '@wordpress/i18n';
import { useCustomCornerstonePages } from './lib/stores/cornerstone-pages';

export const useCornerstoneSummary = () => {
	const [ cornerstonePages ] = useCustomCornerstonePages();
	if ( ! Array.isArray( cornerstonePages ) ) {
		return null;
	}

	return cornerstonePages.length === 0
		? __( 'Homepage', 'jetpack-boost' )
		: sprintf(
				/* translators: %d is the number of pages in the custom cornerstone pages list. */
				_n( 'Homepage + %d page', 'Homepage + %d pages', cornerstonePages.length, 'jetpack-boost' ),
				cornerstonePages.length
			);
};
