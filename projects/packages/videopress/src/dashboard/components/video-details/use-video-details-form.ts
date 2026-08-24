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
 * re-baselines to the new video's values — unless `preserveDirtyOnRebind` is
 * set, in which case fields the user has edited survive the swap. The upload
 * flow's draft session needs that: it hands the form a synthetic record while
 * the file uploads and the real one once it settles, and the id change
 * between the two must not discard a half-typed title. The baseline still
 * moves to the new record, so the kept edits read as dirty (unsaved) against
 * it, which is exactly what they are.
 *
 * `initialDraft` is the same edits arriving from OUTSIDE the mount: the
 * upload's queue row carries them across the handoff to `/video/:id` and
 * across the remounts the tab order causes mid-flow. Read once, at mount, and
 * seeded over the baseline rather than into it — so the carried fields read as
 * unsaved against the server record, which is what they are.
 *
 * @param video                         - The video record to edit.
 * @param options                       - Hook options.
 * @param options.preserveDirtyOnRebind - Keep user-edited fields across an id change.
 * @param options.initialDraft          - Dirty-field diff to seed at mount.
 * @return Form-state controls.
 */
export function useVideoDetailsForm(
	video: LibraryItem,
	{
		preserveDirtyOnRebind = false,
		initialDraft,
	}: {
		preserveDirtyOnRebind?: boolean;
		initialDraft?: Partial< VideoDetailsFormValues >;
	} = {}
) {
	const [ values, setValues ] = useState< VideoDetailsFormValues >( () => ( {
		...baseline( video ),
		...initialDraft,
	} ) );
	const [ base, setBase ] = useState< VideoDetailsFormValues >( () => baseline( video ) );

	// The rebind effect must not fire on mount: the state above is already
	// baselined, and re-running it there would wipe an `initialDraft` before
	// the first paint.
	const boundIdRef = useRef( video.id );

	useEffect( () => {
		if ( boundIdRef.current === video.id ) {
			return;
		}
		boundIdRef.current = video.id;

		const next = baseline( video );
		setValues( prev => {
			if ( ! preserveDirtyOnRebind ) {
				return next;
			}
			// A field counts as the user's when it diverges from the OUTGOING
			// baseline (`base` here predates this effect's setBase below).
			// Untouched fields take the new record's values, so a title the
			// user never edited follows the server's, not the draft's.
			const merged: VideoDetailsFormValues = { ...next };
			for ( const key of Object.keys( next ) as ( keyof VideoDetailsFormValues )[] ) {
				if ( prev[ key ] !== base[ key ] ) {
					// Generic per-key writes need the loosened record view.
					( merged as Record< keyof VideoDetailsFormValues, unknown > )[ key ] = prev[ key ];
				}
			}
			return merged;
		} );
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

	// The same divergence `isDirty` reports, itemised: the fields the user owns
	// right now. Written through to the upload's queue row so the edit survives
	// the handoff and the mid-flow remounts; memoized on the two state values so
	// a consumer effect keyed on it doesn't fire on unrelated renders.
	const dirtyValues = useMemo( () => {
		const diff: Partial< VideoDetailsFormValues > = {};
		for ( const key of Object.keys( values ) as ( keyof VideoDetailsFormValues )[] ) {
			if ( values[ key ] !== base[ key ] ) {
				// Generic per-key writes need the loosened record view.
				( diff as Record< keyof VideoDetailsFormValues, unknown > )[ key ] = values[ key ];
			}
		}
		return diff;
	}, [ values, base ] );

	return { values, update, isDirty, dirtyValues, reset };
}
