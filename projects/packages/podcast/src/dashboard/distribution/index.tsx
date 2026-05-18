import jetpackAnalytics from '@automattic/jetpack-analytics';
import {
	Button,
	Card,
	CardBody,
	Notice,
	Tooltip,
	VisuallyHidden,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalText as Text,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useCopyToClipboard } from '@wordpress/compose';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { check, copy } from '@wordpress/icons';
import { usePodcastSettings } from '../hooks/use-podcast-settings';
import { useValidationIssues } from '../hooks/use-validation-issues';
import ConfettiAnimation from './confetti';
import { PODCAST_APPS } from './podcast-apps';
import PocketCastsRow from './podcast-apps/pocketcasts/inline-row';
import './style.scss';
import SubmitModal from './submit-modal';
import type { PodcastShowState, PodcatcherId } from '../types';
import type { FocusEvent } from 'react';

const prefersReducedMotion = (): boolean =>
	typeof window !== 'undefined' && window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;

const selectOnFocus = ( event: FocusEvent< HTMLInputElement > ) => {
	event.currentTarget.select();
};

// Hoisted so terser can't fold them into __(cond?'a':'b') — the i18n-check
// validator rejects that shape.
const COPIED_LABEL = __( 'Copied!', 'jetpack-podcast' );
const COPY_LINK_LABEL = __( 'Copy link', 'jetpack-podcast' );
const PENDING_LABEL = __( 'Pending', 'jetpack-podcast' );
// `active` means the feed has been crawled by the directory's bot — not that
// the show has actually been published in the directory's catalog. "Submitted"
// reflects what we know; "Live" overpromises.
const SUBMITTED_LABEL = __( 'Submitted', 'jetpack-podcast' );

const StateBadge = ( { state }: { state: PodcastShowState } ) => {
	if ( state !== 'pending' && state !== 'active' ) {
		return null;
	}
	const label = state === 'active' ? SUBMITTED_LABEL : PENDING_LABEL;
	return (
		<span className={ `podcast__state-badge podcast__state-badge--${ state }` }>
			<VisuallyHidden as="span">{ __( 'Status:', 'jetpack-podcast' ) } </VisuallyHidden>
			{ label }
		</span>
	);
};

const FeedCopyField = ( { value }: { value: string } ) => {
	const [ copied, setCopied ] = useState( false );

	const copyRef = useCopyToClipboard< HTMLButtonElement >( value, () => setCopied( true ) );

	useEffect( () => {
		if ( ! copied ) {
			return;
		}
		const timer = setTimeout( () => setCopied( false ), 2000 );
		return () => clearTimeout( timer );
	}, [ copied ] );

	return (
		<HStack alignment="center" spacing={ 2 } className="podcast__feed-copy">
			<input
				type="text"
				className="podcast__feed-copy-input"
				value={ value }
				readOnly
				onFocus={ selectOnFocus }
				aria-label={ __( 'Podcast RSS feed URL', 'jetpack-podcast' ) }
			/>
			<Button
				ref={ copyRef }
				variant="secondary"
				icon={ copied ? check : copy }
				disabled={ ! value }
			>
				{ copied ? COPIED_LABEL : COPY_LINK_LABEL }
			</Button>
		</HStack>
	);
};

interface DistributionTabProps {
	onEditSettings: () => void;
}

const DistributionTab = ( { onEditSettings }: DistributionTabProps ) => {
	const { data: settings } = usePodcastSettings();
	const { issues, isReady, isLoading } = useValidationIssues();
	const categoryId = settings?.podcasting_category_id ?? 0;
	// Canonical category feed URL, derived server-side via get_term_feed_link()
	// so it's correct across every permalink structure. Reconstructing it here by
	// appending `feed/` to the archive link broke plain-permalink / no-trailing-
	// slash sites (e.g. `?cat=5feed/`).
	const feedUrl = settings?.podcasting_feed_url ?? '';
	const isEnabled = categoryId > 0;
	// Includes isLoading so the buttons don't flash enabled before issues resolve.
	const isSubmitBlocked = ! isEnabled || ! isReady || isLoading;

	const [ activeId, setActiveId ] = useState< PodcatcherId | null >( null );
	const [ showConfetti, setShowConfetti ] = useState( false );
	const activeApp = PODCAST_APPS.find( a => a.id === activeId ) ?? null;

	// Pocket Casts auto-submits via the wpcom relay and goes live in minutes,
	// so it only needs a category + title to send a usable feed. The other
	// directories run manual review and reject incomplete feeds, so they keep
	// the full validation gate below.
	const pocketcastsApp = PODCAST_APPS.find( a => a.id === 'pocketcasts' ) ?? null;
	const directoryApps = PODCAST_APPS.filter( a => a.id !== 'pocketcasts' );
	const hasTitle = !! settings?.podcasting_title;
	const isPocketcastsBlocked = isLoading || ! isEnabled || ! hasTitle;
	let pocketcastsBlockedTooltip = '';
	if ( isLoading ) {
		pocketcastsBlockedTooltip = __( 'Checking your podcast setup…', 'jetpack-podcast' );
	} else if ( ! isEnabled ) {
		pocketcastsBlockedTooltip = __( 'Set a podcast category in Settings first', 'jetpack-podcast' );
	} else if ( ! hasTitle ) {
		pocketcastsBlockedTooltip = __( 'Add a podcast title in Settings first', 'jetpack-podcast' );
	}

	// Single source of truth for "what's blocking submission", so the Notice
	// header, Submit aria-labels, and Submit tooltips all stay in sync.
	const stepsLeftLabel =
		issues.length > 0
			? sprintf(
					/* translators: %d: number of remaining setup steps before podcast directory submission is unlocked. */
					_n(
						'%d step left before you can submit',
						'%d steps left before you can submit',
						issues.length,
						'jetpack-podcast'
					),
					issues.length
			  )
			: '';
	// `isLoading` is checked first because on the initial settings fetch
	// `categoryId` defaults to 0 (so `! isEnabled` is true) even for sites
	// that actually have a category set; checking loading first keeps the
	// tooltip on "Checking…" until settings resolve. Gates on `isLoading`
	// rather than `! isReady` because `isReady` is `! isLoading && issues
	// .length === 0`, so once loading finishes with issues outstanding,
	// `! isReady` stays true and would pin the tooltip on "Checking…"
	// instead of the count.
	let blockedTooltip = '';
	if ( isLoading ) {
		blockedTooltip = __( 'Checking your podcast setup…', 'jetpack-podcast' );
	} else if ( ! isEnabled ) {
		blockedTooltip = __( 'Set a podcast category in Settings first', 'jetpack-podcast' );
	} else {
		blockedTooltip = stepsLeftLabel;
	}

	const handleSubmitClick = useCallback( ( id: PodcatcherId ) => {
		jetpackAnalytics.tracks.recordEvent( 'jetpack_podcast_submit_modal_opened', {
			directory: id,
		} );
		setActiveId( id );
	}, [] );

	const handleClose = useCallback( () => {
		setActiveId( null );
	}, [] );

	const handleFirstSave = useCallback( () => {
		setShowConfetti( true );
	}, [] );

	const ActiveModal = activeApp?.Modal ?? SubmitModal;

	return (
		<>
			{ issues.length > 0 && (
				<Notice status="warning" isDismissible={ false } className="podcast__distribution-notice">
					<strong>{ stepsLeftLabel }</strong>
					<ul className="podcast__settings-issues">
						{ issues.map( issue => (
							<li key={ issue }>{ issue }</li>
						) ) }
					</ul>
					<Button variant="link" onClick={ onEditSettings }>
						{ __( 'Edit settings', 'jetpack-podcast' ) }
					</Button>
				</Notice>
			) }

			<Card>
				<CardBody>
					<VStack spacing={ 8 }>
						{ pocketcastsApp && (
							<VStack spacing={ 4 }>
								<VStack spacing={ 1 }>
									<h3 className="podcast__card-title">
										{ __( 'One-click submit', 'jetpack-podcast' ) }
									</h3>
									<Text variant="muted">
										{ __(
											'We submit your feed to Pocket Casts. Most shows go live within a few minutes.',
											'jetpack-podcast'
										) }
									</Text>
								</VStack>
								<PocketCastsRow
									app={ pocketcastsApp }
									isBlocked={ isPocketcastsBlocked }
									blockedTooltip={ pocketcastsBlockedTooltip }
									onFirstSave={ handleFirstSave }
								/>
							</VStack>
						) }

						<VStack spacing={ 4 }>
							<VStack spacing={ 1 }>
								<h3 className="podcast__card-title">
									{ __( 'More directories', 'jetpack-podcast' ) }
								</h3>
								<Text variant="muted">
									{ __(
										'Copy this URL, then submit it to each directory below. Most take a few days to go live.',
										'jetpack-podcast'
									) }
								</Text>
							</VStack>
							{ isEnabled && feedUrl ? (
								<FeedCopyField value={ feedUrl } />
							) : (
								<Text variant="muted">
									{ __(
										'Set your podcast category to generate the feed URL you can submit to directories.',
										'jetpack-podcast'
									) }
								</Text>
							) }
							<VStack as="ul" spacing={ 0 } className="podcast__directory-list">
								{ directoryApps.map( app => {
									const { Logo } = app;
									const state = settings?.podcasting_show_states?.[ app.id ] ?? '';
									return (
										<HStack
											as="li"
											key={ app.id }
											alignment="center"
											justify="space-between"
											className="podcast__directory-row"
										>
											<HStack alignment="center" spacing={ 3 } expanded={ false }>
												<span aria-hidden="true">
													<Logo />
												</span>
												<Text weight={ 500 }>{ app.name }</Text>
												<StateBadge state={ state } />
											</HStack>
											<Tooltip text={ isSubmitBlocked ? blockedTooltip : '' }>
												<Button
													variant="primary"
													size="compact"
													// eslint-disable-next-line react/jsx-no-bind
													onClick={ () => handleSubmitClick( app.id ) }
													disabled={ isSubmitBlocked }
													accessibleWhenDisabled
													aria-label={
														isSubmitBlocked
															? sprintf(
																	/* translators: 1: directory name (Apple Podcasts, Spotify, etc.). 2: reason the Submit button is disabled. */
																	__( 'Submit to %1$s. %2$s', 'jetpack-podcast' ),
																	app.name,
																	blockedTooltip
															  )
															: undefined
													}
												>
													{ __( 'Submit', 'jetpack-podcast' ) }
												</Button>
											</Tooltip>
										</HStack>
									);
								} ) }
							</VStack>
						</VStack>
					</VStack>
				</CardBody>
			</Card>

			{ activeApp && (
				<ActiveModal
					app={ activeApp }
					feedUrl={ feedUrl }
					onClose={ handleClose }
					onFirstSave={ handleFirstSave }
				/>
			) }
			{ showConfetti && <ConfettiAnimation trigger={ ! prefersReducedMotion() } delay={ 300 } /> }
		</>
	);
};

export default DistributionTab;
