/* eslint-disable react/jsx-no-bind */

import {
	Button,
	Modal,
	SelectControl,
	TextControl,
	TextareaControl,
	ToggleControl,
} from '@wordpress/components';
import { store as coreStore, useEntityRecord } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import SerpPreview from './serp-preview';
import type {
	ContentPostType,
	ContentRow,
	SchemaType,
	SeoPostMeta,
} from '../../data/content-types';
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
	// The row that opened the modal (table-loaded values are the initial state).
	row: ContentRow;
	// The core endpoint to save through: 'post' or 'page'.
	postType: ContentPostType;
	onClose: () => void;
}

// The editable subset of SEO meta the modal owns.
type EditableMeta = Pick<
	SeoPostMeta,
	| 'advanced_seo_description'
	| 'jetpack_seo_html_title'
	| 'jetpack_seo_noindex'
	| 'jetpack_seo_schema_type'
>;

/**
 * Edit one post's SEO fields. Loads the live record via core-data
 * (`useEntityRecord`) and saves the post's `meta` through
 * `editEntityRecord` → `saveEditedEntityRecord( 'postType', type, id )`.
 * No custom endpoint. The SERP preview updates live as fields change.
 *
 * @param props          - Component props.
 * @param props.row      - The row that opened the modal (initial field values).
 * @param props.postType - The core endpoint to save through ('post' | 'page').
 * @param props.onClose  - Called to dismiss the modal.
 * @return The edit-SEO modal.
 */
const EditSeoModal: FC< Props > = ( { row, postType, onClose } ) => {
	const { record, isResolving } = useEntityRecord( 'postType', postType, row.id );
	const { editEntityRecord, saveEditedEntityRecord } = useDispatch( coreStore );
	const { createInfoNotice, createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	const [ isSaving, setIsSaving ] = useState( false );

	// Local form state, seeded from the table row so fields are populated before
	// the live record resolves, then reconciled once core-data returns `meta`.
	const [ local, setLocal ] = useState< EditableMeta >( () => ( {
		advanced_seo_description: row.description,
		jetpack_seo_html_title: row.customTitle,
		jetpack_seo_noindex: row.noindex,
		jetpack_seo_schema_type: row.schemaType,
	} ) );

	const recordMeta = ( record as { meta?: Partial< SeoPostMeta > } | undefined )?.meta;
	useEffect( () => {
		if ( ! recordMeta ) {
			return;
		}
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
			editEntityRecord( 'postType', postType, row.id, { meta: local } );
			await saveEditedEntityRecord( 'postType', postType, row.id );
			createSuccessNotice( __( 'SEO updated.', 'jetpack-seo' ), {
				id: SAVE_NOTICE_ID,
				type: 'snackbar',
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
		createErrorNotice,
		createInfoNotice,
		createSuccessNotice,
		editEntityRecord,
		local,
		onClose,
		postType,
		row.id,
		saveEditedEntityRecord,
	] );

	const postTitle = useMemo( () => {
		const rendered = ( record as { title?: { rendered?: string } } | undefined )?.title?.rendered;
		return rendered ? decodeEntities( rendered ) : row.title;
	}, [ record, row.title ] );

	const permalink = ( record as { link?: string } | undefined )?.link ?? row.link;

	return (
		<Modal
			title={ __( 'Edit SEO', 'jetpack-seo' ) }
			onRequestClose={ onClose }
			className="jetpack-seo-content__modal"
		>
			<div className="jetpack-seo-content__modal-body">
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
			<div className="jetpack-seo-content__modal-actions">
				<Button variant="tertiary" onClick={ onClose } disabled={ isSaving }>
					{ __( 'Cancel', 'jetpack-seo' ) }
				</Button>
				<Button variant="primary" onClick={ onSave } isBusy={ isSaving } disabled={ isSaving }>
					{ __( 'Save', 'jetpack-seo' ) }
				</Button>
			</div>
		</Modal>
	);
};

export default EditSeoModal;
