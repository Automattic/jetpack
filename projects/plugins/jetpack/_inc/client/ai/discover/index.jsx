/**
 * Discover view: a catalog of skills the site owner can hand to an AI agent.
 * Lists the skills that run on this kind of site, filtered by category and
 * search, as a grid of cards or a list of rows, each sending its skill to an
 * agent through the shared hand-off (use-send-skill.js). The skill worth
 * running first leads the unfiltered list. View skill opens a skill in the
 * side panel beside the catalog (skill-panel.jsx).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { closeSmall, search } from '@wordpress/icons';
import {
	ButtonLink,
	EmptyState,
	Icon,
	IconButton,
	InputControl,
	InputLayout,
	Link,
	Text,
} from '@wordpress/ui';
import { EVENTS, recordAiHubEvent } from '../tracks';
import CategoryFilter, { ALL } from './category-filter';
import SkillCard from './skill-card';
import { PANEL_TITLE_ID, openSkillPanel, useOpenSkillSlug } from './skill-panel-state';
import { FIRST_SKILL_SLUG, getCatalog } from './skills';
import useSendSkill from './use-send-skill';
import useToolbarOffset from './use-toolbar-offset';
import ViewToggle, { useDiscoverView } from './view-toggle';
import { useIsWordPressAgentAvailable } from './wordpress-agent';

import './style.scss';

// TODO: swap in the real destinations (a suggestion form and the public skill
// catalog) through the redirect service before this leaves the feature flag.
export const SUGGEST_SKILL_URL = 'https://jetpack.com/contact-support/';
export const CATALOG_URL = 'https://jetpack.com/support/jetpack-ai/';

/**
 * Put the skill worth running first at the front of the catalog.
 *
 * @param {Array} catalog - This site's skills, in catalog order.
 * @return {Array} The same skills, the first skill leading.
 */
function leadWithFirstSkill( catalog ) {
	const first = catalog.find( skill => skill.slug === FIRST_SKILL_SLUG );
	return first ? [ first, ...catalog.filter( skill => skill !== first ) ] : catalog;
}

/**
 * Discover view.
 *
 * @return {object} Component markup.
 */
export default function Discover() {
	const isSelfHosted = window?.jetpackAiSettings?.isSelfHosted === true;
	const catalog = useMemo( () => getCatalog( isSelfHosted ), [ isSelfHosted ] );
	const leading = useMemo( () => leadWithFirstSkill( catalog ), [ catalog ] );
	const showWordPressAgent = useIsWordPressAgentAvailable();
	const [ category, setCategory ] = useState( ALL );
	const [ query, setQuery ] = useState( '' );
	const [ view, setView ] = useDiscoverView();
	const searchRef = useRef( null );

	// The toolbar sticks just under the hub's tab strip, not on top of it.
	const rootRef = useRef( null );
	useToolbarOffset( rootRef );

	// The cards' hand-off. The side panel runs its own, with its own location.
	const { send } = useSendSkill( { location: 'card' } );

	// Like SearchControl's clear button: empty the field and put the caret back.
	const clearSearch = useCallback( () => {
		setQuery( '' );
		searchRef.current?.focus();
	}, [] );

	// The skill open in the side panel, which its card marks.
	const openSlug = useOpenSkillSlug();

	// The control that opened the panel, which takes focus back when it closes.
	const returnFocusRef = useRef( null );

	const openSkill = useCallback(
		skill => {
			// The open skill's View skill sends focus over to its panel.
			if ( skill.slug === openSlug ) {
				document.getElementById( PANEL_TITLE_ID )?.focus();
				return;
			}
			const { activeElement } = document;
			returnFocusRef.current = activeElement !== document.body ? activeElement : null;
			openSkillPanel( skill.slug, { source: 'card' } );
		},
		[ openSlug ]
	);

	// Closing the panel (X, Escape or Back) returns focus to the card's View
	// skill link, unless focus has already moved somewhere else. The panel
	// unmounts first, so its focus has dropped to the body by the next frame.
	// A card the filters hid hands it to the search box instead.
	const lastOpenRef = useRef( openSlug );
	useEffect( () => {
		const closed = lastOpenRef.current;
		lastOpenRef.current = openSlug;
		if ( ! closed || openSlug ) {
			return;
		}
		const frame = window.requestAnimationFrame( () => {
			const { activeElement } = document;
			if (
				activeElement &&
				activeElement !== document.body &&
				document.contains( activeElement )
			) {
				return;
			}
			const opener = returnFocusRef.current;
			returnFocusRef.current = null;
			// A panel that opened from a link has no opener; Safari never focuses
			// a clicked link. Either way the card's own link stands in.
			const target = opener?.isConnected
				? opener
				: Array.from( document.querySelectorAll( '.jetpack-ai-discover__view-link' ) ).find( link =>
						link.getAttribute( 'href' )?.endsWith( '/' + closed )
					);
			( target ?? searchRef.current )?.focus();
		} );
		return () => window.cancelAnimationFrame( frame );
	}, [ openSlug ] );

	const handleCategory = useCallback( key => {
		setCategory( key );
		recordAiHubEvent( EVENTS.DISCOVER_FILTERED, { category: key } );
	}, [] );

	const counts = catalog.reduce(
		( result, { category: key } ) => ( { ...result, [ key ]: ( result[ key ] ?? 0 ) + 1 } ),
		{ [ ALL ]: catalog.length }
	);
	const trimmed = query.trim();
	const needle = trimmed.toLocaleLowerCase();
	// Unfiltered, the first skill leads; a filter or search keeps catalog order.
	const isNarrowed = category !== ALL || !! needle;
	const matching = ( isNarrowed ? catalog : leading ).filter(
		item =>
			( category === ALL || item.category === category ) &&
			( ! needle || ( item.title + ' ' + item.blurb ).toLocaleLowerCase().includes( needle ) )
	);

	const recordLink = link => () =>
		recordAiHubEvent( EVENTS.LINK_CLICK, { link_type: 'discover', link } );

	return (
		<div className="jetpack-ai-discover" ref={ rootRef }>
			<div className="jetpack-ai-discover__intro">
				<div className="jetpack-ai-discover__intro-text">
					<Text render={ <h2 /> } variant="heading-xl">
						{ __( 'Skills for your AI agent', 'jetpack' ) }
					</Text>
					<Text render={ <p /> } variant="body-md" className="jetpack-ai-discover__muted">
						{ __( 'Give your agent the expertise to run your site.', 'jetpack' ) }
					</Text>
				</div>
				<Link
					href={ SUGGEST_SKILL_URL }
					openInNewTab
					className="jetpack-ai-discover__suggest"
					onClick={ recordLink( 'suggest_skill' ) }
				>
					{ __( 'Suggest a skill', 'jetpack' ) }
				</Link>
			</div>

			<div className="jetpack-ai-discover__toolbar">
				<CategoryFilter value={ category } counts={ counts } onChange={ handleCategory } />
				<InputControl
					ref={ searchRef }
					className="jetpack-ai-discover__search"
					type="search"
					label={ __( 'Search skills', 'jetpack' ) }
					hideLabelFromVision
					placeholder={ __( 'Search skills', 'jetpack' ) }
					value={ query }
					onValueChange={ setQuery }
					prefix={
						<InputLayout.Slot className="jetpack-ai-discover__search-icon">
							<Icon icon={ search } size={ 20 } />
						</InputLayout.Slot>
					}
					suffix={
						query ? (
							<InputLayout.Slot padding="minimal">
								<IconButton
									icon={ closeSmall }
									label={ __( 'Clear search', 'jetpack' ) }
									variant="minimal"
									tone="neutral"
									size="compact"
									onClick={ clearSearch }
								/>
							</InputLayout.Slot>
						) : null
					}
				/>
				<ViewToggle value={ view } onChange={ setView } />
			</div>

			{ matching.length > 0 ? (
				<div
					className={ view === 'list' ? 'jetpack-ai-discover__list' : 'jetpack-ai-discover__grid' }
				>
					{ matching.map( item => (
						<SkillCard
							key={ item.slug }
							skill={ item }
							layout={ view }
							onView={ openSkill }
							// The cards mark the open skill with data-open.
							isOpen={ item.slug === openSlug }
							onSend={ send }
							showWordPressAgent={ showWordPressAgent }
						/>
					) ) }
				</div>
			) : (
				<EmptyState.Root className="jetpack-ai-discover__empty">
					<EmptyState.Icon icon={ search } />
					<EmptyState.Title>
						{ trimmed
							? sprintf(
									/* translators: %s: what the user searched for. */
									__( 'No skills match “%s”', 'jetpack' ),
									trimmed
								)
							: __( 'No skills match', 'jetpack' ) }
					</EmptyState.Title>
					<EmptyState.Description>
						{ __(
							'Tell us what you need, or browse everything in the public catalog.',
							'jetpack'
						) }
					</EmptyState.Description>
					<EmptyState.Actions>
						<ButtonLink
							href={ SUGGEST_SKILL_URL }
							openInNewTab
							onClick={ recordLink( 'suggest_skill_empty' ) }
						>
							{ __( 'Suggest a skill', 'jetpack' ) }
						</ButtonLink>
						<ButtonLink
							href={ CATALOG_URL }
							openInNewTab
							variant="outline"
							tone="neutral"
							onClick={ recordLink( 'catalog' ) }
						>
							{ __( 'Browse the full catalog', 'jetpack' ) }
						</ButtonLink>
					</EmptyState.Actions>
				</EmptyState.Root>
			) }
		</div>
	);
}
