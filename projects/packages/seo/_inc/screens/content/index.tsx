import { DataViews } from '@wordpress/dataviews';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Badge, Link } from '@wordpress/ui';
import useSeoPosts from '../../data/use-seo-posts';
import EditSeoModal from './edit-seo-modal';
import './style.scss';
import type { ContentPostType, ContentRow } from '../../data/content-types';
import type { Action, Field, Operator, View } from '@wordpress/dataviews';
import type { FC } from 'react';

// Filter field ids that don't map to a server query param. Post type switches
// the core endpoint; schema/description are post-meta the core list can't query
// server-side, so they filter the already-loaded page client-side.
const POST_TYPE_FIELD = 'postType';
const SCHEMA_FIELD = 'schemaType';
const DESCRIPTION_FIELD = 'description';

// Pre-resolved labels so the production minifier can't fold an adjacent
// `cond ? __(A) : __(B)` into `__(cond ? A : B)`, which breaks i18n
// extraction. See feedback_i18n_ternary_minifier_fold.
const articleLabel = __( 'Article', 'jetpack-seo' );
const faqLabel = __( 'FAQ', 'jetpack-seo' );
const setLabel = __( 'Set', 'jetpack-seo' );
const notSetLabel = __( 'Not set', 'jetpack-seo' );
const visibleLabel = __( 'Visible', 'jetpack-seo' );
const hiddenLabel = __( 'Hidden', 'jetpack-seo' );
const noTitleLabel = __( '(no title)', 'jetpack-seo' );

const DEFAULT_VIEW: View = {
	type: 'table',
	perPage: 20,
	page: 1,
	search: '',
	sort: { field: 'title', direction: 'asc' },
	titleField: 'title',
	fields: [ 'schema', 'metaDescription', 'searchVisibility' ],
	filters: [],
};

const defaultLayouts = { table: {} };

/**
 * Map a schema-type value to its display label. `—` when no override is set.
 *
 * @param schemaType - The post's schema-type meta value.
 * @return The label to render in the Schema column.
 */
function schemaLabel( schemaType: ContentRow[ 'schemaType' ] ): string {
	if ( schemaType === 'article' ) {
		return articleLabel;
	}
	if ( schemaType === 'faq' ) {
		return faqLabel;
	}
	return '—';
}

/**
 * Content tab: a DataViews list of posts/pages backed by WordPress core REST,
 * reporting the factual *state* of each post's SEO fields (never a score).
 * Pagination, search, and title sorting are server-side via core-data; the
 * post-type filter switches the core endpoint; schema and meta-description
 * filters narrow the loaded page client-side (core can't query post meta).
 *
 * @return The Content tab content.
 */
const ContentScreen: FC = () => {
	const [ view, setView ] = useState< View >( DEFAULT_VIEW );
	const [ editing, setEditing ] = useState< ContentRow | null >( null );

	// The post-type filter lives in view.filters so it shares the DataViews
	// filter UI; default to posts.
	const postType: ContentPostType = useMemo( () => {
		const value = view.filters?.find( filter => filter.field === POST_TYPE_FIELD )?.value;
		return value === 'page' ? 'page' : 'post';
	}, [ view.filters ] );

	const { items, totalItems, totalPages, isLoading } = useSeoPosts( {
		postType,
		page: view.page || 1,
		perPage: view.perPage || 20,
		search: view.search,
		// Title is the only sortable column; only its direction varies.
		orderby: 'title',
		order: view.sort?.direction === 'desc' ? 'desc' : 'asc',
	} );

	// Client-side narrowing for the two post-meta filters core REST can't query.
	const data = useMemo( () => {
		const schemaValue = view.filters?.find( filter => filter.field === SCHEMA_FIELD )?.value;
		const descriptionValue = view.filters?.find( filter => filter.field === DESCRIPTION_FIELD )
			?.value;

		return items.filter( item => {
			if ( schemaValue !== undefined && schemaValue !== '' && item.schemaType !== schemaValue ) {
				// Schema filter value 'default' targets the no-override rows.
				if ( ! ( schemaValue === 'default' && item.schemaType === '' ) ) {
					return false;
				}
			}
			if ( descriptionValue === 'set' && ! item.hasDescription ) {
				return false;
			}
			if ( descriptionValue === 'not_set' && item.hasDescription ) {
				return false;
			}
			return true;
		} );
	}, [ items, view.filters ] );

	const fields: Field< ContentRow >[] = useMemo(
		() => [
			{
				id: 'title',
				label: __( 'Title', 'jetpack-seo' ),
				enableHiding: false,
				getValue: ( { item } ) => item.title,
				render: ( { item } ) => <Link href={ item.editLink }>{ item.title || noTitleLabel }</Link>,
			},
			{
				id: POST_TYPE_FIELD,
				label: __( 'Type', 'jetpack-seo' ),
				elements: [
					{ value: 'post', label: __( 'Posts', 'jetpack-seo' ) },
					{ value: 'page', label: __( 'Pages', 'jetpack-seo' ) },
				],
				filterBy: { operators: [ 'is' ] as Operator[], isPrimary: true },
				enableSorting: false,
				enableHiding: false,
				render: () => null,
				getValue: () => null,
			},
			{
				id: 'schema',
				label: __( 'Schema', 'jetpack-seo' ),
				enableSorting: false,
				getValue: ( { item } ) => item.schemaType,
				render: ( { item } ) => schemaLabel( item.schemaType ),
			},
			{
				id: SCHEMA_FIELD,
				label: __( 'Schema type', 'jetpack-seo' ),
				elements: [
					{ value: 'default', label: __( 'Default', 'jetpack-seo' ) },
					{ value: 'article', label: articleLabel },
					{ value: 'faq', label: faqLabel },
				],
				filterBy: { operators: [ 'is' ] as Operator[] },
				enableSorting: false,
				enableHiding: false,
				render: () => null,
				getValue: () => null,
			},
			{
				id: 'metaDescription',
				label: __( 'Meta description', 'jetpack-seo' ),
				enableSorting: false,
				getValue: ( { item } ) => ( item.hasDescription ? 'set' : 'not_set' ),
				render: ( { item } ) => (
					<Badge intent={ item.hasDescription ? 'stable' : 'draft' }>
						{ item.hasDescription ? setLabel : notSetLabel }
					</Badge>
				),
			},
			{
				id: DESCRIPTION_FIELD,
				label: __( 'Meta description set', 'jetpack-seo' ),
				elements: [
					{ value: 'set', label: setLabel },
					{ value: 'not_set', label: notSetLabel },
				],
				filterBy: { operators: [ 'is' ] as Operator[] },
				enableSorting: false,
				enableHiding: false,
				render: () => null,
				getValue: () => null,
			},
			{
				id: 'searchVisibility',
				label: __( 'Search', 'jetpack-seo' ),
				enableSorting: false,
				getValue: ( { item } ) => ( item.noindex ? 'hidden' : 'visible' ),
				render: ( { item } ) => (
					<Badge intent={ item.noindex ? 'draft' : 'stable' }>
						{ item.noindex ? hiddenLabel : visibleLabel }
					</Badge>
				),
			},
		],
		[]
	);

	const actions: Action< ContentRow >[] = useMemo(
		() => [
			{
				id: 'edit-seo',
				label: __( 'Edit SEO', 'jetpack-seo' ),
				isPrimary: true,
				supportsBulk: false,
				callback: ( rows: ContentRow[] ) => {
					const [ row ] = rows;
					if ( row ) {
						setEditing( row );
					}
				},
			},
		],
		[]
	);

	const paginationInfo = useMemo(
		() => ( { totalItems, totalPages } ),
		[ totalItems, totalPages ]
	);

	const onChangeView = useCallback( ( next: View ) => setView( next ), [] );
	const getItemId = useCallback( ( item: ContentRow ) => String( item.id ), [] );
	const closeModal = useCallback( () => setEditing( null ), [] );

	return (
		<div className="jetpack-seo-content">
			<DataViews
				data={ data }
				fields={ fields as Field< unknown >[] }
				view={ view }
				onChangeView={ onChangeView }
				paginationInfo={ paginationInfo }
				isLoading={ isLoading }
				getItemId={ getItemId as ( item: unknown ) => string }
				defaultLayouts={ defaultLayouts }
				actions={ actions as Action< unknown >[] }
			/>
			{ editing && <EditSeoModal row={ editing } postType={ postType } onClose={ closeModal } /> }
		</div>
	);
};

export default ContentScreen;
