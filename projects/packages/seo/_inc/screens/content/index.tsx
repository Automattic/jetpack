import { DataViews, filterSortAndPaginate } from '@wordpress/dataviews';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { pencil } from '@wordpress/icons';
import { useNavigate, useSearch } from '@wordpress/route';
import { Badge, IconButton, Link } from '@wordpress/ui';
import useSeoPosts from '../../data/use-seo-posts';
import styles from './style.module.scss';
import type { ContentRow } from '../../data/content-types';
import type { Field, Operator, View } from '@wordpress/dataviews';
import type { FC } from 'react';

// Filter field ids. Every filter runs client-side over the merged content
// set via `filterSortAndPaginate`, matching each row through the field's
// `getValue`. Post type filters on the record's `type`; schema / description /
// search-visibility filter on the derived SEO-meta flags.
const POST_TYPE_FIELD = 'postType';
const SCHEMA_FIELD = 'schemaType';
const DESCRIPTION_FIELD = 'description';
// Filter-only field id for search visibility; the displayed column is
// 'searchVisibility'.
const SEARCH_FIELD = 'searchFilter';
// Filter-only field id for SEO-title set/not-set; the displayed column is
// 'seoTitle'. Lets the Overview "SEO title set" ring deep-link to the rows
// that still need a title.
const TITLE_FIELD = 'titleFilter';

// Schema filter sentinel for the no-override rows. The schema column's raw
// value for those rows is '' (empty meta); the filter element uses this value
// instead so `filterSortAndPaginate` can match it (it skips empty-string
// filter values), and SCHEMA_FIELD's getValue maps '' → this.
const SCHEMA_DEFAULT = 'default';

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
const editSeoLabel = __( 'Edit SEO', 'jetpack-seo' );

const DEFAULT_VIEW: View = {
	type: 'table',
	perPage: 20,
	page: 1,
	search: '',
	sort: { field: 'title', direction: 'asc' },
	titleField: 'title',
	fields: [ 'schema', 'seoTitle', 'metaDescription', 'searchVisibility', 'editAction' ],
	// No post-type filter by default, so every supported type shows.
	filters: [],
};

const defaultLayouts = { table: {} };

// The Overview's coverage rings deep-link here via `?needs=` (see needsToFilter).
type ContentSearch = Record< string, unknown > & { needs?: string };
type ViewFilter = NonNullable< View[ 'filters' ] >[ number ];

/**
 * Map an Overview `?needs=` value to the DataViews filter that narrows the list
 * to the rows still missing that field.
 *
 * @param needs - The `?needs=` query value (schema | title | description | search).
 * @return The matching filter, or null when the value is absent or unrecognized.
 */
function needsToFilter( needs: string | undefined ): ViewFilter | null {
	switch ( needs ) {
		case 'schema':
			return { field: SCHEMA_FIELD, operator: 'is', value: SCHEMA_DEFAULT };
		case 'title':
			return { field: TITLE_FIELD, operator: 'is', value: 'not_set' };
		case 'description':
			return { field: DESCRIPTION_FIELD, operator: 'is', value: 'not_set' };
		case 'search':
			return { field: SEARCH_FIELD, operator: 'is', value: 'hidden' };
		default:
			return null;
	}
}

interface EditButtonProps {
	item: ContentRow;
	onEdit: ( item: ContentRow ) => void;
}

const EditButton: FC< EditButtonProps > = ( { item, onEdit } ) => {
	const handleClick = useCallback( () => onEdit( item ), [ item, onEdit ] );
	return (
		<IconButton
			icon={ pencil }
			label={ editSeoLabel }
			size="small"
			variant="minimal"
			tone="neutral"
			onClick={ handleClick }
		/>
	);
};

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
 * Content route stage: a DataViews list of supported post types backed by
 * WordPress core REST, reporting the factual *state* of each post's SEO fields
 * (never a score). The hook fetches every type and merges them; filtering
 * (including the post-type filter), sorting and pagination all run client-side
 * over the merged set via `filterSortAndPaginate`. Editing a row selects it via
 * the URL (`?postId`), which opens the SEO editor in the route's native
 * inspector sidebar.
 *
 * @return The Content stage content.
 */
const ContentScreen: FC = () => {
	const navigate = useNavigate();

	// Overview coverage rings deep-link here with `?needs=` to pre-filter the list
	// to the rows still missing that field. Seed the initial view once from it; the
	// filter then behaves like any user-applied filter (visible chip, dismissable).
	const search = useSearch( {
		from: '/content' as unknown as never,
		strict: false,
	} ) as ContentSearch;
	const [ view, setView ] = useState< View >( () => {
		const filter = needsToFilter( search.needs );
		return filter ? { ...DEFAULT_VIEW, filters: [ filter ] } : DEFAULT_VIEW;
	} );

	const { items, isLoading, postTypeOptions } = useSeoPosts();

	// Select a row for editing by writing it to the URL; the Content route's
	// `inspector` predicate (`?postId`) then renders the editor in the sidebar.
	const onEdit = useCallback(
		( item: ContentRow ) =>
			navigate( {
				href: `/content?postId=${ item.id }&postType=${ encodeURIComponent( item.type ) }`,
			} ),
		[ navigate ]
	);

	const fields: Field< ContentRow >[] = useMemo(
		() => [
			{
				id: 'title',
				label: __( 'Title', 'jetpack-seo' ),
				enableHiding: false,
				enableGlobalSearch: true,
				getValue: ( { item } ) => item.title,
				render: ( { item } ) => <Link href={ item.editLink }>{ item.title || noTitleLabel }</Link>,
			},
			{
				id: POST_TYPE_FIELD,
				label: __( 'Type', 'jetpack-seo' ),
				elements: postTypeOptions,
				filterBy: { operators: [ 'is' ] as Operator[], isPrimary: true },
				enableSorting: false,
				enableHiding: false,
				// Filter-only field; not shown as a column. Core REST records
				// expose the post type slug, matching the elements, so
				// `filterSortAndPaginate` narrows the merged set.
				render: () => null,
				getValue: ( { item } ) => item.type,
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
					{ value: SCHEMA_DEFAULT, label: __( 'Default', 'jetpack-seo' ) },
					{ value: 'article', label: articleLabel },
					{ value: 'faq', label: faqLabel },
				],
				filterBy: { operators: [ 'is' ] as Operator[] },
				enableSorting: false,
				enableHiding: false,
				render: () => null,
				// Map the no-override value ('') to the filter's sentinel so it
				// matches the "Default" element.
				getValue: ( { item } ) => ( item.schemaType === '' ? SCHEMA_DEFAULT : item.schemaType ),
			},
			{
				id: 'seoTitle',
				label: __( 'SEO title', 'jetpack-seo' ),
				enableSorting: false,
				enableGlobalSearch: true,
				// These columns render a Set/Not set badge, but `getValue` feeds the
				// global search, so it returns the underlying text: typing part of an
				// SEO title or meta description finds the row it belongs to. Nothing
				// sorts or filters on these ids — the set/not-set state has its own
				// filter-only field below.
				getValue: ( { item } ) => item.customTitle,
				render: ( { item } ) => (
					<Badge intent={ item.hasCustomTitle ? 'stable' : 'draft' }>
						{ item.hasCustomTitle ? setLabel : notSetLabel }
					</Badge>
				),
			},
			{
				id: TITLE_FIELD,
				label: __( 'SEO title set', 'jetpack-seo' ),
				elements: [
					{ value: 'set', label: setLabel },
					{ value: 'not_set', label: notSetLabel },
				],
				filterBy: { operators: [ 'is' ] as Operator[] },
				enableSorting: false,
				enableHiding: false,
				render: () => null,
				getValue: ( { item } ) => ( item.hasCustomTitle ? 'set' : 'not_set' ),
			},
			{
				id: 'metaDescription',
				label: __( 'Meta description', 'jetpack-seo' ),
				enableSorting: false,
				enableGlobalSearch: true,
				getValue: ( { item } ) => item.description,
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
				getValue: ( { item } ) => ( item.hasDescription ? 'set' : 'not_set' ),
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
			{
				id: SEARCH_FIELD,
				label: __( 'Search visibility', 'jetpack-seo' ),
				elements: [
					{ value: 'visible', label: visibleLabel },
					{ value: 'hidden', label: hiddenLabel },
				],
				filterBy: { operators: [ 'is' ] as Operator[] },
				enableSorting: false,
				enableHiding: false,
				render: () => null,
				getValue: ( { item } ) => ( item.noindex ? 'hidden' : 'visible' ),
			},
			{
				id: 'editAction',
				label: editSeoLabel,
				enableSorting: false,
				enableHiding: false,
				getValue: () => '',
				render: ( { item } ) => <EditButton item={ item } onEdit={ onEdit } />,
			},
		],
		[ onEdit, postTypeOptions ]
	);

	// Client-side filter, sort and paginate the merged content set. Returns
	// the page slice plus the pagination totals DataViews needs.
	const { data, paginationInfo } = useMemo(
		() => filterSortAndPaginate( items, view, fields ),
		[ items, view, fields ]
	);

	const onChangeView = useCallback( ( next: View ) => setView( next ), [] );
	const getItemId = useCallback( ( item: ContentRow ) => String( item.id ), [] );

	return (
		<div className={ styles.root }>
			<DataViews
				data={ data }
				fields={ fields as Field< unknown >[] }
				view={ view }
				onChangeView={ onChangeView }
				paginationInfo={ paginationInfo }
				isLoading={ isLoading }
				getItemId={ getItemId as ( item: unknown ) => string }
				defaultLayouts={ defaultLayouts }
			/>
		</div>
	);
};

export default ContentScreen;
