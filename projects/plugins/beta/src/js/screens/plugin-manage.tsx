/**
 * PluginManage screen — per-plugin branch picker.
 *
 * Fetches the plugin view on mount and renders:
 * - Global settings toggles (unless it's a mu-plugin)
 * - Currently-running card with bug report link
 * - Branch sections (existing, stable, rc, trunk, pr, release)
 * - "To Test" and "What changed" collapsible panels
 *
 * @package
 */

import { AdminPage } from '@automattic/jetpack-components';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Card, Link, Notice, Stack, Text } from '@wordpress/ui';
import { errorMessage, getPlugin } from '../api/abilities';
import BranchSection from '../components/branch-section';
import Footer from '../components/footer';
import MarkdownPanel from '../components/markdown-panel';
import { CardRowSkeleton } from '../components/skeleton';
import type { BranchCard as BranchCardType, PluginView } from '../api/types';

type Props = {
	slug: string;
};

const boot = window.JetpackBeta;

/**
 * Section definitions in display order.
 * Searchable sections have a search placeholder matching the original PHP template.
 */
const SECTION_CONFIG: Array< {
	key: string;
	title: string;
	searchable?: boolean;
	searchPlaceholder?: string;
} > = [
	{ key: 'existing', title: __( 'Existing', 'jetpack-beta' ) },
	{ key: 'stable', title: __( 'Latest Stable', 'jetpack-beta' ) },
	{ key: 'rc', title: __( 'Release Candidate', 'jetpack-beta' ) },
	{ key: 'trunk', title: __( 'Bleeding Edge', 'jetpack-beta' ) },
	{
		key: 'pr',
		title: __( 'Feature Branches', 'jetpack-beta' ),
		searchable: true,
		searchPlaceholder: __( 'Search for a Feature Branch', 'jetpack-beta' ),
	},
	{
		key: 'release',
		title: __( 'Released Versions', 'jetpack-beta' ),
		searchable: true,
		searchPlaceholder: __( 'Search for a release', 'jetpack-beta' ),
	},
];

/**
 * Group the flat sections array from the API into a map keyed by section name.
 *
 * @param sections - The flat list of branch cards from the API.
 * @return A map from section key to its branch cards.
 */
const groupSections = ( sections: BranchCardType[] ): Map< string, BranchCardType[] > => {
	const map = new Map< string, BranchCardType[] >();
	for ( const card of sections ) {
		const existing = map.get( card.section );
		if ( existing ) {
			existing.push( card );
		} else {
			map.set( card.section, [ card ] );
		}
	}
	return map;
};

/**
 * Render the breadcrumb trail: "Beta Tester / Plugin Name".
 *
 * Mirrors the markup of `@wordpress/admin-ui`'s `Breadcrumbs` (the component the
 * My Jetpack screens use) — same `@wordpress/ui` primitives, `/` separator, and
 * an `h1` current item — but links with a real anchor instead of the TanStack
 * router `Link` that component depends on, since this admin page has no router.
 *
 * @param pluginName - The current plugin name, or null while loading.
 * @return The breadcrumb element.
 */
const renderBreadcrumbs = ( pluginName: string | null ) => (
	<Stack
		direction="row"
		align="center"
		gap="sm"
		render={ <nav aria-label={ __( 'Breadcrumbs', 'jetpack-beta' ) } /> }
	>
		<Text variant="body-lg" render={ <Link tone="neutral" href={ boot.adminUrl } /> }>
			{ __( 'Beta Tester', 'jetpack-beta' ) }
		</Text>
		{ pluginName && (
			<>
				<Text variant="body-lg" aria-hidden="true" className="jetpack-beta-breadcrumb-separator">
					/
				</Text>
				<Text variant="heading-lg" render={ <h1 /> }>
					{ pluginName }
				</Text>
			</>
		) }
	</Stack>
);

/**
 * PluginManage screen component.
 *
 * Fetches the plugin view on mount and renders branch cards for each section,
 * with search filtering for PR and release branches.
 *
 * @param {Props} props - Component props.
 * @return The manage screen element.
 */
const PluginManage = ( { slug }: Props ) => {
	const [ view, setView ] = useState< PluginView | null >( null );
	const [ loading, setLoading ] = useState( true );
	const [ error, setError ] = useState< string | null >( null );

	useEffect( () => {
		let cancelled = false;
		setLoading( true );
		setError( null );
		getPlugin( slug )
			.then( data => {
				if ( ! cancelled ) {
					setView( data );
					setLoading( false );
				}
			} )
			.catch( ( err: unknown ) => {
				if ( ! cancelled ) {
					setError( errorMessage( err, __( 'Could not load plugin.', 'jetpack-beta' ) ) );
					setLoading( false );
				}
			} );
		return () => {
			cancelled = true;
		};
	}, [ slug ] );

	const handleActivated = useCallback( ( updated: PluginView ) => {
		setView( updated );
	}, [] );

	// Prefer the name from the bootstrap so the header renders immediately, then
	// keep using it once the full view has loaded.
	const pluginName = view?.name ?? boot.pluginName ?? null;
	const sectionMap = useMemo(
		() => ( view ? groupSections( view.sections ) : new Map< string, BranchCardType[] >() ),
		[ view ]
	);

	return (
		<AdminPage
			title={ undefined }
			apiRoot={ boot.apiRoot }
			apiNonce={ boot.apiNonce }
			breadcrumbs={ renderBreadcrumbs( pluginName ) }
			showFooter={ false }
			unwrapped
		>
			<div className="jetpack-beta-scroll">
				<div className="jetpack-beta-content">
					{ loading && (
						<Stack direction="column" gap="md">
							{ Array.from( { length: 4 } ).map( ( _, index ) => (
								<CardRowSkeleton key={ index } />
							) ) }
						</Stack>
					) }
					{ error && (
						<Notice.Root intent="error">
							<Notice.Description>{ error }</Notice.Description>
						</Notice.Root>
					) }
					{ view && (
						<Stack direction="column" gap="lg">
							{ view.is_mu_plugin && (
								<Notice.Root intent="info">
									<Notice.Description>
										{ __( 'This plugin will be installed as a mu-plugin. See', 'jetpack-beta' ) }{ ' ' }
										<a
											href="https://github.com/Automattic/jetpack-beta/blob/HEAD/docs/mu-plugin-info.md"
											target="_blank"
											rel="noreferrer"
										>
											{ __( 'the documentation', 'jetpack-beta' ) }
										</a>{ ' ' }
										{ __(
											"for details on what this entails, particularly if you're newly installing a stable version.",
											'jetpack-beta'
										) }
									</Notice.Description>
								</Notice.Root>
							) }

							{ view.currently_running && (
								<Card.Root>
									<Card.Content>
										<Stack direction="row" align="center" justify="space-between">
											<Stack direction="column" gap="xs">
												<Card.Title>
													<Text variant="body-md">
														{ view.name } { __( '— Currently Running', 'jetpack-beta' ) }
													</Text>
												</Card.Title>
												<Text variant="body-sm">
													{ view.currently_running.pretty_version ??
														view.currently_running.version ??
														'' }
												</Text>
											</Stack>
											<Button
												variant="outline"
												tone="neutral"
												size="compact"
												nativeButton={ false }
												render={
													<a
														href={ view.bug_report_url }
														target="_blank"
														rel="external noopener noreferrer"
													/>
												}
											>
												{ __( 'Found a bug? Report it!', 'jetpack-beta' ) }
											</Button>
										</Stack>
									</Card.Content>
								</Card.Root>
							) }

							{ SECTION_CONFIG.map( ( { key, title, searchable, searchPlaceholder } ) => (
								<BranchSection
									key={ key }
									title={ title }
									cards={ sectionMap.get( key ) ?? [] }
									searchable={ searchable }
									searchPlaceholder={ searchPlaceholder }
									pluginSlug={ slug }
									onActivated={ handleActivated }
								/>
							) ) }

							{ view.to_test_html && (
								<MarkdownPanel
									title={ __( 'To Test', 'jetpack-beta' ) }
									html={ view.to_test_html }
								/>
							) }

							{ view.what_changed_html && (
								<MarkdownPanel
									title={ __( 'What changed', 'jetpack-beta' ) }
									html={ view.what_changed_html }
								/>
							) }
						</Stack>
					) }
				</div>
			</div>
			<Footer />
		</AdminPage>
	);
};

export default PluginManage;
