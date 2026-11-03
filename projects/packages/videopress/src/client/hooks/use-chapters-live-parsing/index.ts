/**
 * External dependencies
 */
import { useDebounce } from '@wordpress/compose';
import { useCallback, useEffect, useState } from 'react';
/**
 * Internal dependencies
 */
import extractVideoChapters from '../../utils/video-chapters/extract-video-chapters';
import { getChapterValidationIssues } from '../../utils/video-chapters/validate-chapters';
import type { ChapterValidationIssue } from '../../utils/video-chapters/description';

const CHAPTERS_CHECK_INTERVAL = 3000;

const useChaptersLiveParsing = ( description: string ) => {
	const [ chapterValidationIssues, setChapterValidationIssues ] = useState<
		ChapterValidationIssue[]
	>( [] );

	const checkChapters = useCallback( () => {
		const chapters = extractVideoChapters( description );

		setChapterValidationIssues( chapters.length ? getChapterValidationIssues( chapters ) : [] );
	}, [ description ] );

	const debouncedChapterParsing = useDebounce( checkChapters, CHAPTERS_CHECK_INTERVAL );

	useEffect( () => {
		debouncedChapterParsing();
	}, [ description ] );

	// Check for chapters immediately when the component is mounted
	useEffect( checkChapters, [] );

	return {
		hasIncompleteChapters: chapterValidationIssues.length > 0,
		chapterValidationIssues,
	};
};

export default useChaptersLiveParsing;
