/**
 * External dependencies
 */
import { useDebounce } from '@wordpress/compose';
import { useCallback, useEffect, useState } from 'react';
/**
 * Internal dependencies
 */
import extractVideoChapters from '../../utils/video-chapters/extract-video-chapters';
import validateChapters from '../../utils/video-chapters/validate-chapters';

const CHAPTERS_CHECK_INTERVAL = 3000;

const useChaptersLiveParsing = ( description: string ) => {
	const [ hasIncompleteChapters, setHasIncompleteChapters ] = useState( false );

	const checkChapters = useCallback( () => {
		const chapters = extractVideoChapters( description );

		if ( chapters.length === 0 ) {
			setHasIncompleteChapters( false );
		} else {
			setHasIncompleteChapters( ! validateChapters( chapters ) );
		}
	}, [ description ] );

	const debouncedChapterParsing = useDebounce( checkChapters, CHAPTERS_CHECK_INTERVAL );

	useEffect( () => {
		debouncedChapterParsing();
	}, [ description ] );

	// Check for chapters immediately when the component is mounted
	useEffect( checkChapters, [] );

	return {
		hasIncompleteChapters,
	};
};

export default useChaptersLiveParsing;
