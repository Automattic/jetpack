// Modules admin page (React entry point).
//
// Option C draft v1: replaces the legacy Backbone rendering of
// `admin.php?page=jetpack_modules` with a React tree wrapped in <AdminPage>,
// styled via the shared `jetpack-admin-page-layout` mixin.
//
// Visual goal: preserve trunk's two-column layout (list left, filter sidebar
// right). Modernization comes from swapping primitives — Activate/Deactivate
// buttons become a <ToggleControl>; segmented filters use <ToggleGroupControl>;
// the top-right Dashboard/Settings links are passed to <AdminPage>'s `actions`
// slot.
//
// v1 scope:
//   - Module list from the existing `jetpackModulesData` blob.
//   - Search, active/inactive filter, sort (alphabetical / newest / popular).
//   - Tag sub-filter with counts.
//   - Per-row activate / deactivate via existing server URLs (nonce redirect —
//     the page reloads with fresh data, no client-side state mutation needed).
//   - Settings-link passthrough (server-rendered `configurable` anchor).
//   - Dashboard / Settings as header actions on the right.
//
// Deferred (follow-ups):
//   - Bulk activate / deactivate (dropdown + Apply, with row checkboxes).
//   - Thickbox "More info" per-module modal.
//   - URL state sync (replaceState for search/filter/tag/sort).
//
// The PHP layer (`Jetpack_Settings_Page::page_render`) emits a single
// `<div id="jp-modules-admin-root">` for this entry to mount into.

import { AdminPage, ThemeProvider, getRedirectUrl } from '@automattic/jetpack-components';
import {
	Button,
	SearchControl,
	ToggleControl,
	__experimentalToggleGroupControl as ToggleGroupControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { createRoot } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { useCallback, useMemo, useState } from 'react';
import './style.scss';

type JetpackModule = {
	module: string;
	name: string;
	description: string;
	long_description?: string;
	search_terms?: string;
	sort?: number;
	introduced?: string;
	module_tags: string[];
	activated: boolean;
	available: boolean;
	disabled?: string;
	configurable?: string; // Server-rendered HTML anchor, may be empty.
	learn_more_button?: string;
	activate_nonce?: string;
	deactivate_nonce?: string;
	unavailable_reason?: string;
};

declare global {
	interface Window {
		jetpackModulesData?: {
			modules: Record< string, JetpackModule >;
			i18n: { search_placeholder: string };
			modalinfo?: string | false;
			nonces: { bulk: string };
		};
	}
}

type FilterActive = 'all' | 'true' | 'false';
type SortKey = 'name' | 'introduced' | 'sort';

const adminUrl = ( path: string ): string => {
	// WordPress injects this global on all admin screens.
	const base =
		( window as unknown as { ajaxurl?: string } ).ajaxurl?.replace( /admin-ajax\.php$/, '' ) ||
		'/wp-admin/';
	return `${ base }${ path }`;
};

/**
 * Build the toggle URL for a module row using the existing server-side
 * nonce. The server page handler at `admin.php?page=jetpack&action=...`
 * redirects back to the referrer after completing the toggle, which is
 * why we don't need an optimistic client-side update.
 *
 * @param {JetpackModule} item - Module row.
 * @return {string | null} URL or null if unavailable.
 */
const toggleUrl = ( item: JetpackModule ): string | null => {
	if ( ! item.available ) {
		return null;
	}
	if ( item.activated && item.deactivate_nonce ) {
		return adminUrl(
			`admin.php?page=jetpack&action=deactivate&module=${ encodeURIComponent(
				item.module
			) }&_wpnonce=${ encodeURIComponent( item.deactivate_nonce ) }`
		);
	}
	if ( ! item.activated && item.activate_nonce ) {
		return adminUrl(
			`admin.php?page=jetpack&action=activate&module=${ encodeURIComponent(
				item.module
			) }&_wpnonce=${ encodeURIComponent( item.activate_nonce ) }`
		);
	}
	return null;
};

/**
 * Module list row.
 *
 * @param {object}        props      - Props.
 * @param {JetpackModule} props.item - Module data.
 * @return {import('react').ReactNode} Row markup.
 */
function ModuleRow( { item }: { item: JetpackModule } ) {
	const href = toggleUrl( item );
	const ariaLabel = item.activated
		? // translators: %s: module name.
		  __( 'Deactivate %s', 'jetpack' ).replace( '%s', item.name )
		: // translators: %s: module name.
		  __( 'Activate %s', 'jetpack' ).replace( '%s', item.name );

	const onToggle = useCallback( () => {
		if ( href ) {
			window.location.href = href;
		}
	}, [ href ] );

	return (
		<div
			id={ item.module }
			className={ clsx( 'jp-modules-admin__row', {
				'is-active': item.activated,
				'is-unavailable': ! item.available,
			} ) }
		>
			<div className="jp-modules-admin__row-name">{ item.name }</div>
			<div className="jp-modules-admin__row-actions">
				{ item.configurable && (
					<span
						className="jp-modules-admin__row-configure"
						// Server-generated markup from `Jetpack::get_modules()` — typically
						// a single <a href="...#/…">Configure</a>. Trusted output.
						// eslint-disable-next-line react/no-danger
						dangerouslySetInnerHTML={ { __html: item.configurable } }
					/>
				) }
				{ ! item.available && item.unavailable_reason ? (
					<span className="jp-modules-admin__row-unavailable">{ item.unavailable_reason }</span>
				) : (
					<ToggleControl
						__nextHasNoMarginBottom
						label=""
						checked={ item.activated }
						onChange={ onToggle }
						aria-label={ ariaLabel }
						disabled={ ! href }
					/>
				) }
			</div>
		</div>
	);
}

/**
 * Tag-list button. Pulls the tag click handler out so the button's
 * `onClick` is a stable per-instance callback instead of a re-bound
 * arrow function on every render of the parent.
 *
 * @param {object}   props          - Props.
 * @param {string}   props.tag      - Tag value (empty string acts as "All").
 * @param {string}   props.label    - Display label.
 * @param {number}   props.count    - Count to render after the label.
 * @param {boolean}  props.selected - Whether this tag is currently selected.
 * @param {Function} props.onSelect - Called with the tag value when clicked.
 * @return {import('react').ReactNode} Button.
 */
function TagButton( {
	tag,
	label,
	count,
	selected,
	onSelect,
}: {
	tag: string;
	label: string;
	count: number;
	selected: boolean;
	onSelect: ( tag: string ) => void;
} ) {
	const onClick = useCallback( () => onSelect( tag ), [ onSelect, tag ] );
	return (
		<button
			type="button"
			className={ clsx( 'jp-modules-admin__tag', { 'is-selected': selected } ) }
			onClick={ onClick }
		>
			{ label } <span className="jp-modules-admin__tag-count">({ count })</span>
		</button>
	);
}

/**
 * Main modules admin app.
 *
 * @return {import('react').ReactNode} App tree.
 */
function ModulesAdminApp() {
	const data = window.jetpackModulesData;
	const rawModules = useMemo( () => ( data ? Object.values( data.modules ) : [] ), [ data ] );

	const [ search, setSearch ] = useState( '' );
	const [ filterActive, setFilterActive ] = useState< FilterActive >( 'all' );
	const [ sortBy, setSortBy ] = useState< SortKey >( 'name' );
	const [ moduleTag, setModuleTag ] = useState< string >( '' );

	const tagCounts = useMemo( () => {
		const counts: Record< string, number > = {};
		rawModules.forEach( m =>
			( m.module_tags || [] ).forEach( t => {
				counts[ t ] = ( counts[ t ] || 0 ) + 1;
			} )
		);
		return counts;
	}, [ rawModules ] );

	const filtered = useMemo( () => {
		let items = [ ...rawModules ];

		if ( moduleTag ) {
			items = items.filter( i => ( i.module_tags || [] ).includes( moduleTag ) );
		}

		if ( filterActive !== 'all' ) {
			const want = filterActive === 'true';
			items = items.filter( i => !! i.activated === want );
		}

		if ( search ) {
			const needle = search.toLowerCase();
			items = items.filter( i =>
				[
					i.name,
					i.description,
					i.long_description,
					i.search_terms,
					( i.module_tags || [] ).join( ' ' ),
				]
					.filter( Boolean )
					.join( ' ' )
					.toLowerCase()
					.includes( needle )
			);
		}

		const dir = sortBy === 'introduced' ? -1 : 1;
		items.sort( ( a, b ) => {
			const av = ( a as unknown as Record< string, unknown > )[ sortBy ];
			const bv = ( b as unknown as Record< string, unknown > )[ sortBy ];
			if ( av === bv ) {
				return 0;
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return ( av as any ) > ( bv as any ) ? dir : -dir;
		} );

		// Push unavailable modules to the bottom.
		items.sort( ( a, b ) => Number( b.available ) - Number( a.available ) );

		return items;
	}, [ rawModules, moduleTag, filterActive, search, sortBy ] );

	const sortedTags = useMemo(
		() => Object.keys( tagCounts ).sort( ( a, b ) => a.localeCompare( b ) ),
		[ tagCounts ]
	);

	const onChangeFilterActive = useCallback( ( v: string | number | undefined ) => {
		setFilterActive( v as FilterActive );
	}, [] );

	const onChangeSortBy = useCallback( ( v: string | number | undefined ) => {
		setSortBy( v as SortKey );
	}, [] );

	const headerActions = (
		<HStack spacing={ 2 } justify="flex-end">
			<Button variant="secondary" href={ adminUrl( 'admin.php?page=jetpack#/dashboard' ) }>
				{ __( 'Dashboard', 'jetpack' ) }
			</Button>
			<Button variant="secondary" href={ adminUrl( 'admin.php?page=jetpack#/settings' ) }>
				{ __( 'Settings', 'jetpack' ) }
			</Button>
		</HStack>
	);

	if ( ! data ) {
		return (
			<AdminPage title={ __( 'Modules', 'jetpack' ) } actions={ headerActions }>
				<p>{ __( 'No module data available.', 'jetpack' ) }</p>
			</AdminPage>
		);
	}

	return (
		<AdminPage
			title={ __( 'Modules', 'jetpack' ) }
			actions={ headerActions }
			optionalMenuItems={ [
				{ label: __( 'Support', 'jetpack' ), href: getRedirectUrl( 'jetpack-support' ) },
			] }
		>
			<div className="jp-modules-admin">
				<div className="jp-modules-admin__layout">
					<div className="jp-modules-admin__list" role="list">
						{ filtered.length ? (
							filtered.map( item => <ModuleRow key={ item.module } item={ item } /> )
						) : (
							<div className="jp-modules-admin__empty">
								{ __( 'No modules found.', 'jetpack' ) }
							</div>
						) }
					</div>

					<aside className="jp-modules-admin__sidebar" aria-label={ __( 'Filters', 'jetpack' ) }>
						<SearchControl
							__nextHasNoMarginBottom
							className="jp-modules-admin__search"
							value={ search }
							onChange={ setSearch }
							placeholder={ data.i18n.search_placeholder }
						/>

						<ToggleGroupControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							isBlock
							label={ __( 'View', 'jetpack' ) }
							value={ filterActive }
							onChange={ onChangeFilterActive }
						>
							<ToggleGroupControlOption value="all" label={ __( 'All', 'jetpack' ) } />
							<ToggleGroupControlOption value="true" label={ __( 'Active', 'jetpack' ) } />
							<ToggleGroupControlOption value="false" label={ __( 'Inactive', 'jetpack' ) } />
						</ToggleGroupControl>

						<ToggleGroupControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							isBlock
							label={ __( 'Sort by', 'jetpack' ) }
							value={ sortBy }
							onChange={ onChangeSortBy }
						>
							<ToggleGroupControlOption value="name" label={ __( 'Alphabetical', 'jetpack' ) } />
							<ToggleGroupControlOption value="introduced" label={ __( 'Newest', 'jetpack' ) } />
							<ToggleGroupControlOption value="sort" label={ __( 'Popular', 'jetpack' ) } />
						</ToggleGroupControl>

						<div className="jp-modules-admin__tags">
							<div className="jp-modules-admin__tags-label">{ __( 'Show', 'jetpack' ) }</div>
							<ul>
								<li>
									<TagButton
										tag=""
										label={ __( 'All', 'jetpack' ) }
										count={ rawModules.length }
										selected={ moduleTag === '' }
										onSelect={ setModuleTag }
									/>
								</li>
								{ sortedTags.map( tag => (
									<li key={ tag }>
										<TagButton
											tag={ tag }
											label={ tag }
											count={ tagCounts[ tag ] }
											selected={ moduleTag === tag }
											onSelect={ setModuleTag }
										/>
									</li>
								) ) }
							</ul>
						</div>
					</aside>
				</div>
			</div>
		</AdminPage>
	);
}

const container = document.getElementById( 'jp-modules-admin-root' );
if ( container ) {
	const root = createRoot( container );
	root.render(
		<ThemeProvider targetDom={ document.body }>
			<ModulesAdminApp />
		</ThemeProvider>
	);
}
