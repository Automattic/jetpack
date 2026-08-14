import jetpackAnalytics from '@automattic/jetpack-analytics';
import {
	Button,
	Card,
	CardBody,
	Notice,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalText as Text,
} from '@wordpress/components';
import { useCopyToClipboard } from '@wordpress/compose';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { check, copy } from '@wordpress/icons';
import { Stack } from '@wordpress/ui';
import { usePodcastSettings } from '../hooks/use-podcast-settings';
import { useValidationIssues } from '../hooks/use-validation-issues';
import ConfettiAnimation from './confetti';
import { DirectoryList } from './directory-list';
import { PODCAST_APPS } from './podcast-apps';
import './style.scss';
import SubmitModal from './submit-modal';
import type { PodcatcherId } from '../types';
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
const CHECKING_LABEL = __( 'Checking your podcast setup…', 'jetpack-podcast' );
const NEED_CATEGORY_LABEL = __( 'Set a post category in Settings first', 'jetpack-podcast' );
const NEED_TITLE_LABEL = __( 'Add a podcast title in Settings first', 'jetpack-podcast' );

const AUTOMATIC_APPS = PODCAST_APPS.filter( app => app.submission === 'automatic' );
const MANUAL_APPS = PODCAST_APPS.filter( app => app.submission === 'manual' );

const blockedReason = ( isLoading: boolean, isEnabled: boolean, remaining: string ): string => {
	if ( isLoading ) {
		return CHECKING_LABEL;
	}
	if ( ! isEnabled ) {
		return NEED_CATEGORY_LABEL;
	}
	return remaining;
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
		<Stack align="center" gap="sm" className="podcast__feed-copy">
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
		</Stack>
	);
};

interface DistributionTabProps {
	onEditSettings: () => void;
}

const DistributionTab = ( { onEditSettings }: DistributionTabProps ) => {
	const { data: settings, isLoading: settingsLoading } = usePodcastSettings();
	const { issues, isLoading } = useValidationIssues();
	// Canonical category feed URL, derived server-side via get_term_feed_link()
	// so it's correct across every permalink structure. Reconstructing it here by
	// appending `feed/` to the archive link broke plain-permalink / no-trailing-
	// slash sites (e.g. `?cat=5feed/`).
	const feedUrl = settings?.podcasting_feed_url ?? '';
	const isEnabled = ( settings?.podcasting_category_id ?? 0 ) > 0;
	const states = settings?.podcasting_show_states ?? {};

	const [ activeId, setActiveId ] = useState< PodcatcherId | null >( null );
	const [ showConfetti, setShowConfetti ] = useState( false );
	const activeApp = PODCAST_APPS.find( a => a.id === activeId ) ?? null;

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

	const automaticBlocked = blockedReason(
		settingsLoading,
		isEnabled,
		settings?.podcasting_title ? '' : NEED_TITLE_LABEL
	);
	const manualBlocked = blockedReason( isLoading, isEnabled, stepsLeftLabel );

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
					<Stack direction="column" gap="2xl">
						<Text variant="muted">
							{ __(
								'Submit your podcast to the most popular podcast apps so people can find and follow it.',
								'jetpack-podcast'
							) }
						</Text>

						{ AUTOMATIC_APPS.length > 0 && (
							<Stack direction="column" gap="lg">
								<Stack direction="column" gap="xs">
									<h3 className="podcast__card-title">
										{ __( 'Automatic submission', 'jetpack-podcast' ) }
									</h3>
									<Text variant="muted">
										{ __(
											'We submit your feed to Pocket Casts for you. It usually goes live within a few minutes.',
											'jetpack-podcast'
										) }
									</Text>
								</Stack>
								<DirectoryList
									apps={ AUTOMATIC_APPS }
									states={ states }
									blockedReason={ automaticBlocked }
									onOpenModal={ handleSubmitClick }
									onFirstSave={ handleFirstSave }
								/>
							</Stack>
						) }

						<Stack direction="column" gap="lg">
							<Stack direction="column" gap="xs">
								<h3 className="podcast__card-title">
									{ __( 'Manual submission', 'jetpack-podcast' ) }
								</h3>
								<Text variant="muted">
									{ __(
										'Copy this URL, then submit it to each directory through the modals below.',
										'jetpack-podcast'
									) }
								</Text>
							</Stack>
							{ isEnabled && feedUrl ? (
								<FeedCopyField value={ feedUrl } />
							) : (
								<Text variant="muted">
									{ __(
										'Set your post category to generate the feed URL you can submit to directories.',
										'jetpack-podcast'
									) }
								</Text>
							) }
							<DirectoryList
								apps={ MANUAL_APPS }
								states={ states }
								blockedReason={ manualBlocked }
								onOpenModal={ handleSubmitClick }
								onFirstSave={ handleFirstSave }
							/>
						</Stack>
					</Stack>
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
