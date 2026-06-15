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

import { AdminPage, JetpackFooter } from '@automattic/jetpack-components';
import {
	createInterpolateElement,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Card, Link, Notice, Stack, Text } from '@wordpress/ui';
import { errorMessage, getPlugin } from '../api/abilities';
import { getBetaData } from '../api/boot';
import { isPlainClick, useBetaNavigate } from '../api/navigation';
import BranchRow from '../components/branch-card';
import BranchSection from '../components/branch-section';
import MarkdownPanel from '../components/markdown-panel';
import { ListSkeleton } from '../components/skeleton';
import UpdatesPanel from '../components/updates-panel';
import type { BranchCard as BranchCardType, PluginView } from '../api/types';
import type { MouseEvent } from 'react';

type Props = {
	slug: string;
};

const boot = getBetaData();

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
		searchPlaceholder: __( 'Search by name, PR number, or GitHub URL', 'jetpack-beta' ),
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
 * Tracked upstream: https://github.com/WordPress/gutenberg/issues/77039
 *
 * @param pluginName - The current plugin name, or null while loading.
 * @param onBack     - Click handler for the root breadcrumb link.
 * @return The breadcrumb element.
 */
const renderBreadcrumbs = ( pluginName: string | null, onBack: ( event: MouseEvent ) => void ) => (
	<Stack
		direction="row"
		align="center"
		gap="sm"
		render={ <nav aria-label={ __( 'Breadcrumbs', 'jetpack-beta' ) } /> }
	>
		<Text
			variant="body-lg"
			render={ <Link tone="neutral" href={ boot.adminUrl } onClick={ onBack } /> }
		>
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
	const mounted = useRef( true );

	useEffect(
		() => () => {
			mounted.current = false;
		},
		[]
	);

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
		if ( mounted.current ) {
			setView( updated );
		}
	}, [] );

	// Refresh the view after an in-place update so the running version updates.
	const handleUpdated = useCallback( () => {
		getPlugin( slug )
			.then( data => {
				if ( mounted.current ) {
					setView( data );
				}
			} )
			.catch( () => {
				// Leave the current view in place; the update itself succeeded.
			} );
	}, [ slug ] );

	// Prefer the name from the bootstrap so the header renders immediately, then
	// keep using it once the full view has loaded.
	const pluginName = view?.name ?? boot.pluginName ?? null;

	const navigate = useBetaNavigate();
	const onBack = useCallback(
		( event: MouseEvent ) => {
			// Return to the overview client-side on a plain click.
			if ( isPlainClick( event ) ) {
				event.preventDefault();
				navigate( null );
			}
		},
		[ navigate ]
	);
	const sectionMap = useMemo(
		() => ( view ? groupSections( view.sections ) : new Map< string, BranchCardType[] >() ),
		[ view ]
	);

	// The simple (non-searchable) sections collapse into a single compact list
	// card, each row labeled by its section title. The searchable sections keep
	// their own search box and compact list below.
	const simpleRows = useMemo(
		() =>
			SECTION_CONFIG.filter( s => ! s.searchable ).flatMap( s =>
				( sectionMap.get( s.key ) ?? [] ).map( card => ( { card, title: s.title } ) )
			),
		[ sectionMap ]
	);

	return (
		<AdminPage
			title={ undefined }
			apiRoot={ boot.apiRoot }
			apiNonce={ boot.apiNonce }
			breadcrumbs={ renderBreadcrumbs( pluginName, onBack ) }
			showFooter={ false }
			unwrapped
		>
			<div className="jetpack-beta-scroll">
				<div className="jetpack-beta-content">
					<Stack direction="column" gap="lg">
						<UpdatesPanel slug={ slug } onUpdated={ handleUpdated } />
						{ loading && <ListSkeleton rows={ 4 } /> }
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
											{ createInterpolateElement(
												__(
													"This plugin will be installed as a mu-plugin. See <link>the documentation</link> for details on what this entails, particularly if you're newly installing a stable version.",
													'jetpack-beta'
												),
												{
													link: (
														<a
															href="https://github.com/Automattic/jetpack-beta/blob/HEAD/docs/mu-plugin-info.md"
															target="_blank"
															rel="noreferrer"
															aria-label={ __(
																'the documentation (opens in a new tab)',
																'jetpack-beta'
															) }
														/>
													),
												}
											) }
										</Notice.Description>
									</Notice.Root>
								) }

								{ view.currently_running && (
									<Card.Root>
										<Card.Content>
											<Stack direction="row" align="center" justify="space-between">
												<Stack direction="column" gap="xs">
													<Card.Title render={ <h2 /> }>
														{ sprintf(
															/* translators: %s: plugin name. */
															__( '%s — Currently Running', 'jetpack-beta' ),
															view.name
														) }
													</Card.Title>
													<Text variant="body-sm">
														{ view.currently_running.pretty_version ??
															view.currently_running.version ??
															'' }
													</Text>
												</Stack>
												{ /* A link styled as a button (it navigates to the bug-report URL).
												     Until a first-class link-button lands upstream
												     (https://github.com/WordPress/gutenberg/issues/77098) we render
												     Button as an anchor so it stays a real, focusable link. */ }
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
															aria-label={ __(
																'Found a bug? Report it! (opens in a new tab)',
																'jetpack-beta'
															) }
														/>
													}
												>
													{ __( 'Found a bug? Report it!', 'jetpack-beta' ) }
												</Button>
											</Stack>
										</Card.Content>
									</Card.Root>
								) }

								{ simpleRows.length > 0 && (
									<Card.Root className="jetpack-beta-list">
										{ simpleRows.map( ( { card, title } ) => (
											<BranchRow
												key={ `${ card.section }-${ card.source ?? '' }-${ card.id ?? '' }` }
												card={ card }
												title={ title }
												pluginSlug={ slug }
												onActivated={ handleActivated }
											/>
										) ) }
									</Card.Root>
								) }

								{ SECTION_CONFIG.filter( s => s.searchable ).map(
									( { key, title, searchPlaceholder } ) => (
										<BranchSection
											key={ key }
											title={ title }
											cards={ sectionMap.get( key ) ?? [] }
											searchable
											searchPlaceholder={ searchPlaceholder }
											pluginSlug={ slug }
											onActivated={ handleActivated }
										/>
									)
								) }

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
					</Stack>
				</div>
			</div>
			<JetpackFooter showDefaultLinks={ false } />
		</AdminPage>
	);
};

export default PluginManage;
