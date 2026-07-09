/* eslint-disable react/jsx-no-bind */

import { SelectControl, TextControl, TextareaControl, ToggleControl } from '@wordpress/components';
import { store as coreStore, useEntityRecord } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
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
 * Edit one post's SEO fields, rendered in the Content route's native inspector
 * sidebar and keyed by the selected `postId`. Loads the live record via
 * core-data (`useEntityRecord`) and saves the post's `meta` through
 * `editEntityRecord` → `saveEditedEntityRecord( 'postType', type, id )` — no
 * custom endpoint. On success it dispatches a coverage delta to the shared store
 * so the Overview card reflects the change without a page reload. The SERP
 * preview updates live as fields change.
 *
 * @param props          - Component props.
 * @param props.postId   - The selected post id.
 * @param props.postType - The core endpoint to save through ('post' | 'page').
 * @param props.onClose  - Dismiss the inspector.
 * @return The SEO inspector editor.
 */
const SeoInspector: FC< Props > = ( { postId, postType, onClose } ) => {
	const { record, isResolving } = useEntityRecord( 'postType', postType, postId );
	const { editEntityRecord, saveEditedEntityRecord } = useDispatch( coreStore );
	const { createInfoNotice, createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	const { applyCoverageDelta } = useDispatch( coverageStore );
	const [ isSaving, setIsSaving ] = useState( false );

	// Empty until the live record resolves; reconciled from its `meta` below.
	// Saving is blocked while resolving so we never persist these empty defaults
	// over the post's existing meta.
	const [ local, setLocal ] = useState< EditableMeta >( EMPTY_META );

	// Seed the form once per mount (the route keys this component by postId), so
	// a background refetch changing `recordMeta` identity can't overwrite edits.
	const hasSeeded = useRef( false );
	const recordMeta = ( record as { meta?: Partial< SeoPostMeta > } | undefined )?.meta;
	useEffect( () => {
		if ( ! recordMeta || hasSeeded.current ) {
			return;
		}
		hasSeeded.current = true;
		setLocal( {
			advanced_seo_description: recordMeta.advanced_seo_description ?? '',
			jetpack_seo_html_title: recordMeta.jetpack_seo_html_title ?? '',
			jetpack_seo_noindex: !! recordMeta.jetpack_seo_noindex,
			jetpack_seo_schema_type:
				recordMeta.jetpack_seo_schema_type === 'article' ||
				recordMeta.jetpack_seo_schema_type === 'faq'
					? recordMeta.jetpack_seo_schema_type
					: '',
		} );
	}, [ recordMeta ] );

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
		try {
			// Stage the meta edit, then persist it. core-data merges `meta`, so we
			// only send the four SEO keys, leaving any other post meta untouched.
			editEntityRecord( 'postType', postType, postId, { meta: local } );
			// throwOnError so a failed save rejects instead of resolving; without it
			// core-data swallows the error and we'd report success on failure.
			await saveEditedEntityRecord( 'postType', postType, postId, { throwOnError: true } );
			createSuccessNotice( __( 'SEO updated.', 'jetpack-seo' ), {
				id: SAVE_NOTICE_ID,
				type: 'snackbar',
			} );
			// Reflect the edit on the Overview coverage card without a reload,
			// baselining the delta against the live pre-save record's meta. Search
			// visibility is the inverse of noindex, so a post counts as "visible"
			// when noindex is off.
			const priorHasDescription = ( recordMeta?.advanced_seo_description ?? '' ) !== '';
			const priorHasSchema =
				recordMeta?.jetpack_seo_schema_type === 'article' ||
				recordMeta?.jetpack_seo_schema_type === 'faq';
			const priorHasTitle = ( recordMeta?.jetpack_seo_html_title ?? '' ) !== '';
			// Coerce noindex to a boolean (matching how local state is seeded above) so
			// visibility is computed consistently.
			const priorNoindex = !! recordMeta?.jetpack_seo_noindex;
			const priorVisible = ! priorNoindex;
			applyCoverageDelta( {
				schema: Number( local.jetpack_seo_schema_type !== '' ) - Number( priorHasSchema ),
				title: Number( local.jetpack_seo_html_title !== '' ) - Number( priorHasTitle ),
				description:
					Number( local.advanced_seo_description !== '' ) - Number( priorHasDescription ),
				search_visible: Number( ! local.jetpack_seo_noindex ) - Number( priorVisible ),
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
		createErrorNotice,
		createInfoNotice,
		createSuccessNotice,
		editEntityRecord,
		local,
		onClose,
		postId,
		postType,
		recordMeta,
		saveEditedEntityRecord,
	] );

	const postTitle = useMemo( () => {
		const rendered = ( record as { title?: { rendered?: string } } | undefined )?.title?.rendered;
		return rendered ? decodeEntities( rendered ) : '';
	}, [ record ] );

	const permalink = ( record as { link?: string } | undefined )?.link ?? '';

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
					// Also disabled when the record failed to load (`recordMeta` never
					// resolved): the form still holds EMPTY_META, and saving that would
					// wipe the post's existing SEO meta.
					disabled={ isSaving || isResolving || ! recordMeta }
				>
					{ __( 'Save', 'jetpack-seo' ) }
				</Button>
			</div>
		</div>
	);
};

export default SeoInspector;
