import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import type { LibraryItem, VideoDetailsPatch } from '../../types/library';

export type VideoDetailsFormValues = Required< VideoDetailsPatch >;

const baseline = ( video: LibraryItem ): VideoDetailsFormValues => ( {
	title: video.title,
	description: video.description,
	privacy: video.privacy,
	displayEmbed: video.displayEmbed,
	allowDownloads: video.allowDownloads,
	rating: video.rating,
} );

const shallowEqual = ( a: VideoDetailsFormValues, b: VideoDetailsFormValues ): boolean =>
	a.title === b.title &&
	a.description === b.description &&
	a.privacy === b.privacy &&
	a.displayEmbed === b.displayEmbed &&
	a.allowDownloads === b.allowDownloads &&
	a.rating === b.rating;

/**
 * Local form state for the Video details screen. One `update(partial)`
 * callback drives all fields. `isDirty` is true when current values diverge
 * from the most-recent baseline (initial mount or last `reset()`).
 *
 * If `video.id` changes (user navigates between details pages), state
 * re-baselines to the new video's values.
 *
 * @param video - The video record to edit.
 * @return Form-state controls.
 */
export function useVideoDetailsForm( video: LibraryItem ) {
	const [ values, setValues ] = useState< VideoDetailsFormValues >( () => baseline( video ) );
	const [ base, setBase ] = useState< VideoDetailsFormValues >( () => baseline( video ) );

	useEffect( () => {
		const next = baseline( video );
		setValues( next );
		setBase( next );
	}, [ video.id ] );

	const update = useCallback( ( partial: Partial< VideoDetailsFormValues > ) => {
		setValues( prev => ( { ...prev, ...partial } ) );
	}, [] );

	const reset = useCallback(
		( next?: VideoDetailsFormValues ) => {
			const target = next ?? base;
			setValues( target );
			setBase( target );
		},
		[ base ]
	);

	const isDirty = useMemo( () => ! shallowEqual( values, base ), [ values, base ] );

	return { values, update, isDirty, reset };
}
