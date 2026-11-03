import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
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
 * @param video            - The video record to edit.
 * @param options          - Upload handover options.
 * @param options.uploadId - Temporary ID whose edited fields should survive registration.
 * @param options.draft    - Edits retained across visits to the uploading video.
 * @return Form-state controls.
 */
export function useVideoDetailsForm(
	video: LibraryItem,
	{ uploadId, draft }: { uploadId?: string; draft?: VideoDetailsPatch } = {}
) {
	const [ values, setValues ] = useState< VideoDetailsFormValues >( () => baseline( video ) );
	const [ base, setBase ] = useState< VideoDetailsFormValues >( () => baseline( video ) );
	const boundId = useRef( video.id );
	const editedFields = useRef( new Set< keyof VideoDetailsFormValues >() );

	useEffect( () => {
		if ( boundId.current === video.id ) {
			return;
		}
		const next = baseline( video );
		const keepDraft = boundId.current === uploadId;
		const fields = new Set( [
			...editedFields.current,
			...( Object.keys( draft ?? {} ) as ( keyof VideoDetailsFormValues )[] ),
		] );
		setValues( previous =>
			keepDraft
				? { ...next, ...Object.fromEntries( [ ...fields ].map( key => [ key, previous[ key ] ] ) ) }
				: next
		);
		setBase( next );
		boundId.current = video.id;
		editedFields.current.clear();
	}, [ video.id ] );

	const update = useCallback( ( partial: Partial< VideoDetailsFormValues > ) => {
		// Reverting to the original value is still an edit during an upload handover.
		for ( const key of Object.keys( partial ) as ( keyof VideoDetailsFormValues )[] ) {
			editedFields.current.add( key );
		}
		setValues( prev => ( { ...prev, ...partial } ) );
	}, [] );

	const reset = useCallback(
		( next?: VideoDetailsFormValues ) => {
			const target = next ?? base;
			setValues( target );
			setBase( target );
			editedFields.current.clear();
		},
		[ base ]
	);

	const isDirty = useMemo( () => ! shallowEqual( values, base ), [ values, base ] );

	return { values, update, isDirty, reset };
}
