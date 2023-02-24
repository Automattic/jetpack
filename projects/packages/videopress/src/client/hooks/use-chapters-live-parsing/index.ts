/**
 * External dependencies
 */
import { useDebounce } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useState } from 'react';
/**
 * Internal dependencies
 */
import extractVideoChapters from '../../utils/video-chapters/extract-video-chapters';
import validateChapters from '../../utils/video-chapters/validate-chapters';

const CHAPTERS_CHECK_INTERVAL = 3000;

const useChaptersLiveParsing = description => {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const [ hasIncompleteChapters, setHasIncompleteChapters ] = useState( false );

	const learnMoreHelperText = __(
		'Did you know you can now add Chapters to your videos? <link>Learn how</link>',
		'jetpack-videopress-pkg'
	);

	const incompleteChaptersNoticeText = __(
		'It seems there are some chapters, but they are incomplete. Check out the <link>format</link> and try again.',
		'jetpack-videopress-pkg'
	);

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
		isModalOpen,
		setIsModalOpen,
		hasIncompleteChapters,
		setHasIncompleteChapters,
		learnMoreHelperText,
		incompleteChaptersNoticeText,
	};
};

export default useChaptersLiveParsing;
