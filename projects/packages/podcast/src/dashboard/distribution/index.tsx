import jetpackAnalytics from '@automattic/jetpack-analytics';
import {
	Button,
	Card,
	CardBody,
	Notice,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalText as Text,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useCopyToClipboard } from '@wordpress/compose';
import { useEntityRecord } from '@wordpress/core-data';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { check, copy } from '@wordpress/icons';
import { usePodcastSettings } from '../hooks/use-podcast-settings';
import { useValidationIssues } from '../hooks/use-validation-issues';
import ConfettiAnimation from './confetti';
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
	// Pull the configured category record so we can derive the feed URL
	// (`{category-archive}feed/`) without needing PHP-side script data.
	const { record: category } = useEntityRecord< { link?: string } >(
		'taxonomy',
		'category',
		categoryId,
		{ enabled: categoryId > 0 }
	);
	const feedUrl = category?.link ? `${ category.link }feed/` : '';
	const isEnabled = categoryId > 0;
	// Includes isLoading so the buttons don't flash enabled before issues resolve.
	const isSubmitBlocked = ! isEnabled || ! isReady || isLoading;

	const [ activeId, setActiveId ] = useState< PodcatcherId | null >( null );
	const [ showConfetti, setShowConfetti ] = useState( false );
	const activeApp = PODCAST_APPS.find( a => a.id === activeId ) ?? null;

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
				<Notice status="warning" isDismissible={ false }>
					<strong>{ __( 'Almost ready to submit', 'jetpack-podcast' ) }</strong>
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
						<VStack spacing={ 4 }>
							<VStack spacing={ 1 }>
								<h3 className="podcast__card-title">{ __( 'RSS feed', 'jetpack-podcast' ) }</h3>
								<Text variant="muted">
									{ __(
										'Copy this URL, then submit it to each directory below to publish your podcast.',
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
						</VStack>

						<VStack spacing={ 4 }>
							<VStack spacing={ 1 }>
								<h3 className="podcast__card-title">
									{ __( 'Podcast directories', 'jetpack-podcast' ) }
								</h3>
								<Text variant="muted">
									{ __(
										'Submit your podcast to the directories below where you want it to appear. Most take a few days to go live.',
										'jetpack-podcast'
									) }
								</Text>
							</VStack>
							<VStack as="ul" spacing={ 0 } className="podcast__directory-list">
								{ PODCAST_APPS.map( app => {
									const { Logo } = app;
									return (
										<HStack
											as="li"
											key={ app.id }
											alignment="center"
											justify="space-between"
											className="podcast__directory-row"
										>
											<HStack alignment="center" spacing={ 4 } expanded={ false }>
												<span aria-hidden="true">
													<Logo />
												</span>
												<Text weight={ 500 }>{ app.name }</Text>
											</HStack>
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
																/* translators: %s is the directory name (Apple Podcasts, Spotify, etc.). */
																__(
																	'Submit to %s (finish setting up your podcast first).',
																	'jetpack-podcast'
																),
																app.name
														  )
														: undefined
												}
											>
												{ __( 'Submit', 'jetpack-podcast' ) }
											</Button>
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
