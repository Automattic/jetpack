/* eslint-disable react/jsx-no-bind */

import { Notice, Spinner } from '@wordpress/components';
import { DataViews } from '@wordpress/dataviews';
import { useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { useSearchParams } from 'react-router';
import { useSeoPosts } from '../../data/use-seo-posts';
import SerpPreviewModal, { type SerpPreviewPayload } from '../shared/serp-preview-modal';
import EditSeoModal from './edit-seo-modal';
import styles from './style.module.scss';
import type { SeoPostItem, SeoStatus } from '../../data/content-types';
import type { Action, Field, View } from '@wordpress/dataviews';
import type { FC } from 'react';

const STATUS_OPTIONS: Array< { label: string; value: SeoStatus } > = [
	{ label: __( 'Good', 'jetpack-seo' ), value: 'good' },
	{ label: __( 'Fair', 'jetpack-seo' ), value: 'fair' },
	{ label: __( 'Poor', 'jetpack-seo' ), value: 'poor' },
];

const SCHEMA_OPTIONS: Array< { label: string; value: string } > = [
	{ label: __( 'Default', 'jetpack-seo' ), value: '' },
	{ label: __( 'Article', 'jetpack-seo' ), value: 'article' },
	{ label: __( 'FAQ', 'jetpack-seo' ), value: 'faq' },
	{ label: __( 'How-to', 'jetpack-seo' ), value: 'howto' },
	{ label: __( 'Local business', 'jetpack-seo' ), value: 'localbusiness' },
	{ label: __( 'Organization', 'jetpack-seo' ), value: 'organization' },
];

const DEFAULT_VIEW: View = {
	type: 'table',
	perPage: 20,
	page: 1,
	sort: { field: 'title', direction: 'asc' },
	fields: [ 'seo_status', 'seo_title', 'seo_description', 'schema_type', 'noindex' ],
	titleField: 'title',
};

const isSeoStatus = ( value: string | null ): value is SeoStatus =>
	value === 'good' || value === 'fair' || value === 'poor';

const ContentScreen: FC = () => {
	const [ searchParams ] = useSearchParams();
	// Seed the initial view from a `?status=good|fair|poor` query param so
	// the Overview's Content SEO health card can deep-link to a pre-filtered
	// list. Captured at mount only — users can clear the filter afterwards.
	const [ view, setView ] = useState< View >( () => {
		const initialStatus = searchParams.get( 'status' );
		if ( ! isSeoStatus( initialStatus ) ) {
			return DEFAULT_VIEW;
		}
		return {
			...DEFAULT_VIEW,
			filters: [ { field: 'seo_status', operator: 'isAny', value: [ initialStatus ] } ],
		};
	} );
	const [ editItem, setEditItem ] = useState< SeoPostItem | null >( null );
	const [ previewItem, setPreviewItem ] = useState< SeoPostItem | null >( null );

	// Pull the user's current `seo_status` filter out of the DataViews
	// view so we can forward it to the REST endpoint. The endpoint post-
	// filters on the computed tier — DataViews alone would just hide rows
	// from the client page without re-fetching.
	const seoStatusFilter = view.filters?.find( filter => filter.field === 'seo_status' )?.value as
		| string[]
		| undefined;

	// DataViews keeps the filter bar visibility in private internal state
	// (only auto-opens for `isPrimary` filters, which also locks the
	// toggle). When we arrive pre-filtered via `/content?status=…` we
	// still want the chip visible on first paint, so we simulate a click
	// on DataViews' own visibility toggle once. The toggle stays live
	// after, so the user can collapse the bar normally.
	const screenRef = useRef< HTMLDivElement >( null );
	const hasOpenedFiltersRef = useRef( false );
	useEffect( () => {
		if ( hasOpenedFiltersRef.current || ! seoStatusFilter?.length ) {
			return;
		}
		const toggle = screenRef.current?.querySelector< HTMLButtonElement >(
			'.dataviews-filters__visibility-toggle'
		);
		if ( toggle && toggle.getAttribute( 'aria-pressed' ) !== 'true' ) {
			toggle.click();
			hasOpenedFiltersRef.current = true;
		}
	}, [ seoStatusFilter ] );

	const { data, isLoading, isError, error } = useSeoPosts( {
		page: view.page ?? 1,
		perPage: view.perPage ?? 20,
		search: view.search,
		seoStatus: seoStatusFilter,
	} );

	const fields: Field< SeoPostItem >[] = useMemo(
		() => [
			{
				id: 'title',
				label: __( 'Title', 'jetpack-seo' ),
				enableHiding: false,
				render: ( { item } ) => <span className={ styles.truncate }>{ item.title }</span>,
			},
			{
				id: 'seo_status',
				label: __( 'Status', 'jetpack-seo' ),
				elements: STATUS_OPTIONS,
				filterBy: { operators: [ 'isAny' ] },
				render: ( { item } ) => (
					<span className={ styles.trafficLight }>
						<span
							className={ clsx( styles.trafficDot, {
								[ styles.trafficGood ]: item.seo_status === 'good',
								[ styles.trafficFair ]: item.seo_status === 'fair',
								[ styles.trafficPoor ]: item.seo_status === 'poor',
							} ) }
							aria-hidden="true"
						/>
						{ item.seo_status }
					</span>
				),
			},
			{
				id: 'seo_title',
				label: __( 'SEO title', 'jetpack-seo' ),
				render: ( { item } ) => (
					<span className={ styles.truncate }>
						{ item.seo_title || <em>{ __( 'Uses post title', 'jetpack-seo' ) }</em> }
					</span>
				),
			},
			{
				id: 'seo_description',
				label: __( 'SEO description', 'jetpack-seo' ),
				render: ( { item } ) => (
					<span className={ styles.truncate }>
						{ item.seo_description || <em>{ __( 'Not set', 'jetpack-seo' ) }</em> }
					</span>
				),
			},
			{
				id: 'schema_type',
				label: __( 'Schema', 'jetpack-seo' ),
				elements: SCHEMA_OPTIONS,
				filterBy: { operators: [ 'isAny' ] },
				render: ( { item } ) => item.schema_type || __( 'Default', 'jetpack-seo' ),
			},
			{
				id: 'noindex',
				label: __( 'Noindex', 'jetpack-seo' ),
				render: ( { item } ) =>
					item.noindex ? __( 'Yes', 'jetpack-seo' ) : __( 'No', 'jetpack-seo' ),
			},
		],
		[]
	);

	const actions: Action< SeoPostItem >[] = useMemo(
		() => [
			{
				id: 'edit-seo',
				label: __( 'Edit SEO', 'jetpack-seo' ),
				isPrimary: true,
				callback: items => {
					const target = items[ 0 ];
					if ( target ) {
						setEditItem( target );
					}
				},
			},
			{
				id: 'preview',
				label: __( 'Preview', 'jetpack-seo' ),
				callback: items => {
					const target = items[ 0 ];
					if ( target ) {
						setPreviewItem( target );
					}
				},
			},
			{
				id: 'open-in-editor',
				label: __( 'Open in editor', 'jetpack-seo' ),
				callback: items => {
					const target = items[ 0 ];
					if ( target?.edit_link ) {
						window.location.href = target.edit_link;
					}
				},
			},
		],
		[]
	);

	if ( isError ) {
		return (
			<Notice status="error" isDismissible={ false }>
				{ error?.message ?? __( 'Unable to load posts.', 'jetpack-seo' ) }
			</Notice>
		);
	}

	const items = data?.items ?? [];
	const paginationInfo = {
		totalItems: data?.total ?? 0,
		totalPages: data?.pages ?? 0,
	};

	const previewPayload: SerpPreviewPayload | null = previewItem
		? {
				title: previewItem.seo_title || previewItem.title,
				description: previewItem.seo_description,
				url: previewItem.permalink,
		  }
		: null;

	return (
		<>
			{ isLoading && ! data && <Spinner /> }
			<div className={ styles.dataviewsWrapper } ref={ screenRef }>
				<DataViews< SeoPostItem >
					data={ items }
					fields={ fields }
					view={ view }
					onChangeView={ setView }
					actions={ actions }
					paginationInfo={ paginationInfo }
					defaultLayouts={ { table: {} } }
					getItemId={ item => String( item.id ) }
					isLoading={ isLoading }
				/>
			</div>
			{ editItem && <EditSeoModal item={ editItem } onClose={ () => setEditItem( null ) } /> }
			{ previewItem && previewPayload && (
				<SerpPreviewModal payload={ previewPayload } onClose={ () => setPreviewItem( null ) } />
			) }
		</>
	);
};

export default ContentScreen;
