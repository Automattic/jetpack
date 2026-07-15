/* eslint-disable react/jsx-no-bind */

import apiFetch from '@wordpress/api-fetch';
import { SelectControl, TextControl, TextareaControl, ToggleControl } from '@wordpress/components';
import { store as coreStore, useEntityRecord } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { Button, IconButton } from '@wordpress/ui';
import { coverageStore } from '../../data/coverage-store';
import SerpPreview from './serp-preview';
import type { ContentPostType, SchemaType, SeoPostMeta } from '../../data/content-types';
import type { FC } from 'react';

// Single snackbar id reused across a save so "Saving…" is replaced in place by
// "SEO updated." (or an error) — mirrors the Settings page's two-stage toast.
const SAVE_NOTICE_ID = 'jetpack-seo-content-save';

// Pre-resolved schema-type options so the production minifier can't fold an
// adjacent `cond ? __(A) : __(B)` into `__(cond ? A : B)`, which breaks i18n
// extraction. See feedback_i18n_ternary_minifier_fold.
const SCHEMA_OPTIONS: Array< { value: SchemaType; label: string } > = [
	{ value: '', label: __( 'Default', 'jetpack-seo' ) },
	{ value: 'article', label: __( 'Article', 'jetpack-seo' ) },
	{ value: 'faq', label: __( 'FAQ', 'jetpack-seo' ) },
];

interface Props {
	// The selected post id (from the Content route's `?postId`).
	postId: number;
	// The core endpoint to save through: 'post' or 'page'.
	postType: ContentPostType;
	// Dismiss the inspector (clears the URL selection).
	onClose: () => void;
}

// The editable subset of SEO meta the inspector owns.
type EditableMeta = Pick<
	SeoPostMeta,
	| 'advanced_seo_description'
	| 'jetpack_seo_html_title'
	| 'jetpack_seo_noindex'
	| 'jetpack_seo_schema_type'
>;

const EMPTY_META: EditableMeta = {
	advanced_seo_description: '',
	jetpack_seo_html_title: '',
	jetpack_seo_noindex: false,
	jetpack_seo_schema_type: '',
};

/**
 * Narrow a record's raw `meta` to the four SEO keys this inspector owns,
 * defaulting anything missing or unrecognised. Used both to seed the form from
 * the live record and to snapshot the pre-save values we roll back to.
 *
 * @param meta - The record's `meta`, if it has resolved.
 * @return The editable SEO meta.
 */
function toEditableMeta( meta: Partial< SeoPostMeta > | undefined ): EditableMeta {
	return {
		advanced_seo_description: meta?.advanced_seo_description ?? '',
		jetpack_seo_html_title: meta?.jetpack_seo_html_title ?? '',
		jetpack_seo_noindex: !! meta?.jetpack_seo_noindex,
		jetpack_seo_schema_type:
			meta?.jetpack_seo_schema_type === 'article' || meta?.jetpack_seo_schema_type === 'faq'
				? meta.jetpack_seo_schema_type
				: '',
	};
}

/**
 * Edit one post's SEO fields, rendered in the Content route's native inspector
 * sidebar and keyed by the selected `postId`. Loads the live record via core-data
 * (`useEntityRecord`) and persists the post's `meta` through the post's own core
 * REST route — no custom endpoint. On success it dispatches a coverage delta to
 * the shared store so the Overview card reflects the change without a page
 * reload. The SERP preview updates live as fields change.
 *
 * @param props          - Component props.
 * @param props.postId   - The selected post id.
 * @param props.postType - The core endpoint to save through ('post' | 'page').
 * @param props.onClose  - Dismiss the inspector.
 * @return The SEO inspector editor.
 */
const SeoInspector: FC< Props > = ( { postId, postType, onClose } ) => {
	// The *edited* record, not the persisted one. Saving stages the new meta as a
	// core-data edit rather than writing it back over the persisted record (see
	// `onSave`), so `record` still holds the pre-save meta afterwards — seeding the
	// form from it would show a stale value every time the inspector is reopened.
	const { editedRecord, isResolving } = useEntityRecord( 'postType', postType, postId );
	const { editEntityRecord } = useDispatch( coreStore );
	// The post type's REST route ('/wp/v2/posts', '/wp/v2/pages'), read from the
	// entity config rather than pluralised by hand. Resolved by the time the
	// record above is, and saving is blocked until then.
	const baseURL = useSelect(
		select =>
			(
				select( coreStore ) as {
					getEntityConfig: ( kind: string, name: string ) => { baseURL?: string } | undefined;
				}
			 ).getEntityConfig( 'postType', postType )?.baseURL,
		[ postType ]
	);
	const { createInfoNotice, createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	const { applyCoverageDelta } = useDispatch( coverageStore );
	const [ isSaving, setIsSaving ] = useState( false );

	// Empty until the live record resolves; reconciled from its `meta` below.
	// Saving is blocked while resolving so we never persist these empty defaults
	// over the post's existing meta.
	const [ local, setLocal ] = useState< EditableMeta >( EMPTY_META );

	// Seed the form once per mount (the route keys this component by postId), so
	// a background refetch changing `editedMeta` identity can't overwrite edits.
	const hasSeeded = useRef( false );
	const editedMeta = ( editedRecord as { meta?: Partial< SeoPostMeta > } | undefined )?.meta;
	useEffect( () => {
		if ( ! editedMeta || hasSeeded.current ) {
			return;
		}
		hasSeeded.current = true;
		setLocal( toEditableMeta( editedMeta ) );
	}, [ editedMeta ] );

	const setField = useCallback(
		( patch: Partial< EditableMeta > ) => setLocal( state => ( { ...state, ...patch } ) ),
		[]
	);

	const onSave = useCallback( async () => {
		setIsSaving( true );
		createInfoNotice( __( 'Saving…', 'jetpack-seo' ), {
			id: SAVE_NOTICE_ID,
			type: 'snackbar',
			isDismissible: false,
		} );
		// The values to roll back to if the request fails, and the baseline the
		// coverage delta is measured against. Snapshotted before the optimistic edit
		// below, which is what `editedMeta` would otherwise reflect. Reading the
		// *edited* meta keeps both correct when the same post is saved twice without
		// an intervening reload.
		const previous = toEditableMeta( editedMeta );
		try {
			// Update the record in the store, then persist it with `apiFetch`.
			//
			// Deliberately *not* `saveEditedEntityRecord`: core-data's save ends by
			// dispatching RECEIVE_ITEMS with `invalidateCache: true` (there's no way
			// to suppress it), and `getEntityRecords.shouldInvalidate` drops every
			// query for the post type. SEO meta changes neither collection membership
			// nor ordering, so none of that data went stale. `useSeoPosts` overlays
			// these edits onto the fetched records, which is what updates the row.
			//
			// core-data merges `meta` edits (the postType entity declares it in
			// `mergedEdits`), so we only send the four SEO keys and leave any other
			// post meta untouched.
			editEntityRecord( 'postType', postType, postId, { meta: local } );
			// `apiFetch` rejects on a failed request, so a save that fails can't fall
			// through to the success notice below — the `throwOnError` that
			// `saveEditedEntityRecord` needed for that (#50319) has no equivalent here.
			try {
				await apiFetch( {
					path: `${ baseURL }/${ postId }`,
					method: 'POST',
					data: { meta: local },
				} );
			} catch ( error ) {
				editEntityRecord( 'postType', postType, postId, { meta: previous } );
				throw error;
			}
			createSuccessNotice( __( 'SEO updated.', 'jetpack-seo' ), {
				id: SAVE_NOTICE_ID,
				type: 'snackbar',
			} );
			// Reflect the edit on the Overview coverage card without a reload,
			// baselining the delta against the pre-save meta. Search visibility is the
			// inverse of noindex, so a post counts as "visible" when noindex is off.
			applyCoverageDelta( {
				schema:
					Number( local.jetpack_seo_schema_type !== '' ) -
					Number( previous.jetpack_seo_schema_type !== '' ),
				title:
					Number( local.jetpack_seo_html_title !== '' ) -
					Number( previous.jetpack_seo_html_title !== '' ),
				description:
					Number( local.advanced_seo_description !== '' ) -
					Number( previous.advanced_seo_description !== '' ),
				search_visible:
					Number( ! local.jetpack_seo_noindex ) - Number( ! previous.jetpack_seo_noindex ),
			} );
			onClose();
		} catch ( error ) {
			createErrorNotice(
				( error as { message?: string } )?.message ??
					__( 'Could not save. Please try again.', 'jetpack-seo' ),
				{ id: SAVE_NOTICE_ID, type: 'snackbar' }
			);
		} finally {
			setIsSaving( false );
		}
	}, [
		applyCoverageDelta,
		baseURL,
		createErrorNotice,
		createInfoNotice,
		createSuccessNotice,
		editEntityRecord,
		editedMeta,
		local,
		onClose,
		postId,
		postType,
	] );

	const postTitle = useMemo( () => {
		const rendered = ( editedRecord as { title?: { rendered?: string } } | undefined )?.title
			?.rendered;
		return rendered ? decodeEntities( rendered ) : '';
	}, [ editedRecord ] );

	const permalink = ( editedRecord as { link?: string } | undefined )?.link ?? '';

	return (
		<div className="jetpack-seo-content__inspector" aria-label={ __( 'Edit SEO', 'jetpack-seo' ) }>
			<div className="jetpack-seo-content__inspector-header">
				<h2 className="jetpack-seo-content__inspector-title">
					{ __( 'Edit SEO', 'jetpack-seo' ) }
				</h2>
				<IconButton
					icon={ close }
					label={ __( 'Close', 'jetpack-seo' ) }
					onClick={ onClose }
					disabled={ isSaving }
					size="small"
					variant="minimal"
					tone="neutral"
				/>
			</div>
			<div className="jetpack-seo-content__inspector-body">
				<TextControl
					label={ __( 'SEO title', 'jetpack-seo' ) }
					help={ __(
						'Overrides the title search engines show. Leave blank to use the post title.',
						'jetpack-seo'
					) }
					value={ local.jetpack_seo_html_title }
					onChange={ next => setField( { jetpack_seo_html_title: next } ) }
					disabled={ isResolving }
					__next40pxDefaultSize
					__nextHasNoMarginBottom
				/>
				<TextareaControl
					label={ __( 'Meta description', 'jetpack-seo' ) }
					help={ __( 'The summary search engines may show under the title.', 'jetpack-seo' ) }
					value={ local.advanced_seo_description }
					onChange={ next => setField( { advanced_seo_description: next } ) }
					rows={ 3 }
					disabled={ isResolving }
					__nextHasNoMarginBottom
				/>
				<SelectControl
					label={ __( 'Schema type', 'jetpack-seo' ) }
					value={ local.jetpack_seo_schema_type }
					options={ SCHEMA_OPTIONS }
					onChange={ next => setField( { jetpack_seo_schema_type: next as SchemaType } ) }
					disabled={ isResolving }
					__next40pxDefaultSize
					__nextHasNoMarginBottom
				/>
				<ToggleControl
					label={ __( 'Hide from search engines', 'jetpack-seo' ) }
					help={ __(
						'Adds a noindex directive and excludes this content from the sitemap.',
						'jetpack-seo'
					) }
					checked={ local.jetpack_seo_noindex }
					onChange={ next => setField( { jetpack_seo_noindex: next } ) }
					disabled={ isResolving }
					__nextHasNoMarginBottom
				/>
				<SerpPreview
					link={ permalink }
					postTitle={ postTitle }
					customTitle={ local.jetpack_seo_html_title }
					description={ local.advanced_seo_description }
				/>
			</div>
			<div className="jetpack-seo-content__inspector-actions">
				<Button variant="minimal" tone="neutral" onClick={ onClose } disabled={ isSaving }>
					{ __( 'Cancel', 'jetpack-seo' ) }
				</Button>
				<Button
					onClick={ onSave }
					loading={ isSaving }
					// Also disabled when the record failed to load (`editedMeta` never
					// resolved): the form still holds EMPTY_META, and saving that would
					// wipe the post's existing SEO meta. And when the entity config hasn't
					// resolved, since `baseURL` is the route we save through.
					disabled={ isSaving || isResolving || ! editedMeta || ! baseURL }
				>
					{ __( 'Save', 'jetpack-seo' ) }
				</Button>
			</div>
		</div>
	);
};

export default SeoInspector;
