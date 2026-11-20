/**
 * Discover view: a catalog of skills the site owner can hand to an AI agent,
 * a row per category, or one grid once filtered or searched. Each card sends
 * its skill to an agent through the shared hand-off (use-send-skill.js) and
 * opens it in the side panel beside the catalog (skill-panel.jsx).
 */

import { getScrollContainer } from '@wordpress/dom';
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
import CategoryRow, { CategoryHeading } from './category-row';
import SkillCard from './skill-card';
import { PANEL_TITLE_ID, openSkillPanel, useOpenSkillSlug } from './skill-panel-state';
import {
	LEADING_SKILL_SLUGS,
	getCatalog,
	getCategoryName,
	getOrderedCategoryKeys,
	isInCategory,
} from './skills';
import useSendSkill from './use-send-skill';
import useToolbarOffset from './use-toolbar-offset';
import { useIsWordPressAgentAvailable } from './wordpress-agent';

import './style.scss';

// TODO: swap in the real suggestion form through the redirect service before
// this leaves the feature flag.
export const SUGGEST_SKILL_URL = 'https://jetpack.com/contact-support/';
export const CATALOG_URL = 'https://agentskills.wordpress.com/';

/**
 * Scroll the page back to its top: AdminPage's scrolling middle, or the window.
 *
 * @param {HTMLElement} node - An element inside the page.
 */
function scrollToTop( node ) {
	const reduce = window.matchMedia?.( '(prefers-reduced-motion: reduce)' ).matches;
	const options = { top: 0, behavior: reduce ? 'auto' : 'smooth' };
	( ( node && getScrollContainer( node.parentElement ) ) || window ).scrollTo( options );
}

/**
 * A category's skills, its leading ones first, the rest in the order given.
 *
 * @param {Array}  skills - The skills to pick from.
 * @param {string} key    - The category key.
 * @return {Array} The category's skills.
 */
function inCategory( skills, key ) {
	const members = skills.filter( skill => isInCategory( skill, key ) );
	const leaders = ( LEADING_SKILL_SLUGS[ key ] ?? [] )
		.map( slug => members.find( skill => skill.slug === slug ) )
		.filter( Boolean );
	return [ ...leaders, ...members.filter( skill => ! leaders.includes( skill ) ) ];
}

/**
 * Discover view.
 *
 * @return {object} Component markup.
 */
export default function Discover() {
	const catalog = useMemo( () => getCatalog(), [] );
	const showWordPressAgent = useIsWordPressAgentAvailable();
	const [ category, setCategory ] = useState( ALL );
	const [ query, setQuery ] = useState( '' );
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
				: Array.from( document.querySelectorAll( '.jetpack-ai-discover__card-open' ) ).find( link =>
						link.getAttribute( 'href' )?.endsWith( '/' + closed )
					);
			( target ?? searchRef.current )?.focus();
		} );
		return () => window.cancelAnimationFrame( frame );
	}, [ openSlug ] );

	// A new category starts from the top, not wherever the last one was scrolled.
	const handleCategory = useCallback( key => {
		setCategory( key );
		recordAiHubEvent( EVENTS.DISCOVER_FILTERED, { category: key } );
		scrollToTop( rootRef.current );
	}, [] );

	// A skill counts toward each category it's in.
	const counts = { [ ALL ]: catalog.length };
	catalog.forEach( item =>
		item.categories.forEach( key => ( counts[ key ] = ( counts[ key ] ?? 0 ) + 1 ) )
	);
	const trimmed = query.trim();
	const needle = trimmed.toLocaleLowerCase();
	// A category's leading skills head it, as a row or filtered; a search
	// keeps catalog order.
	const isNarrowed = category !== ALL || !! needle;
	const searched = catalog.filter(
		item =>
			! needle || ( item.title + ' ' + item.description ).toLocaleLowerCase().includes( needle )
	);
	let matching = searched;
	if ( category !== ALL ) {
		matching = needle
			? searched.filter( item => isInCategory( item, category ) )
			: inCategory( searched, category );
	}

	let emptyTitle = __( 'No skills match', 'jetpack' );
	if ( ! catalog.length ) {
		emptyTitle = __( 'Skills couldn’t be loaded', 'jetpack' );
	} else if ( trimmed ) {
		emptyTitle = sprintf(
			/* translators: %s: what the user searched for. */
			__( 'No skills match “%s”', 'jetpack' ),
			trimmed
		);
	}

	const renderCard = ( item, headingLevel ) => (
		<SkillCard
			key={ item.slug }
			skill={ item }
			headingLevel={ headingLevel }
			onView={ openSkill }
			isOpen={ item.slug === openSlug }
			onSend={ send }
			showWordPressAgent={ showWordPressAgent }
		/>
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
			</div>

			{ /* Unfiltered, a row per category; a filter or a search shows one grid. */ }
			{ matching.length > 0 && ! isNarrowed && (
				<div className="jetpack-ai-discover__rows">
					{ getOrderedCategoryKeys( counts ).map( key => (
						<CategoryRow key={ key } title={ getCategoryName( key ) } count={ counts[ key ] }>
							{ inCategory( matching, key ).map( item => renderCard( item, 4 ) ) }
						</CategoryRow>
					) ) }
				</div>
			) }
			{ matching.length > 0 && isNarrowed && (
				<div className="jetpack-ai-discover__row">
					{ /* A filtered category keeps its heading, as its row has. */ }
					{ category !== ALL && (
						<div className="jetpack-ai-discover__row-header">
							<CategoryHeading title={ getCategoryName( category ) } count={ matching.length } />
						</div>
					) }
					<div className="jetpack-ai-discover__grid">
						{ matching.map( item => renderCard( item, category !== ALL ? 4 : 3 ) ) }
					</div>
				</div>
			) }
			{ matching.length === 0 && (
				<EmptyState.Root className="jetpack-ai-discover__empty">
					<EmptyState.Icon icon={ search } />
					<EmptyState.Title>{ emptyTitle }</EmptyState.Title>
					<EmptyState.Description>
						{ catalog.length
							? __(
									'Tell us what you need, or browse everything in the public catalog.',
									'jetpack'
								)
							: __( 'Try again later, or browse everything in the public catalog.', 'jetpack' ) }
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
