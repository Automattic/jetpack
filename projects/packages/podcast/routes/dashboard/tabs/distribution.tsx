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
import { useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { check, copy } from '@wordpress/icons';
import SubmitModal from '../components/submit-modal';
import { usePodcastSettings } from '../hooks/use-podcast-settings';
import { useValidationIssues } from '../hooks/use-validation-issues';
import { PODCAST_APPS } from '../podcast-apps';
import { getPodcastScriptData } from '../script-data';
import type { PodcatcherId } from '../types';
import type { FocusEvent } from 'react';

const selectOnFocus = ( event: FocusEvent< HTMLInputElement > ) => {
	event.currentTarget.select();
};

// Hoisted so terser can't fold them into __(cond?'a':'b') — the i18n-check
// validator rejects that shape.
const COPIED_LABEL = __( 'Copied!', 'jetpack-podcast' );
const COPY_LINK_LABEL = __( 'Copy link', 'jetpack-podcast' );

const FeedCopyField = ( { value }: { value: string } ) => {
	const [ copied, setCopied ] = useState( false );

	const copyRef = useCopyToClipboard< HTMLButtonElement >( value, () => {
		setCopied( true );
		setTimeout( () => setCopied( false ), 2000 );
	} );

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

const goToSettingsTab = () => {
	window.location.hash = '#settings';
};

const DistributionTab = () => {
	const { data: settings } = usePodcastSettings();
	const { issues, isReady, isLoading } = useValidationIssues();
	const scriptData = getPodcastScriptData();
	const feedUrl = scriptData.feedUrl;
	const isEnabled = !! settings?.podcasting_category_id;
	// Includes isLoading so the buttons don't flash enabled before issues resolve.
	const isSubmitBlocked = ! isEnabled || ! isReady || isLoading;

	const [ activeId, setActiveId ] = useState< PodcatcherId | null >( null );
	const activeApp = PODCAST_APPS.find( a => a.id === activeId ) ?? null;

	const handleClose = useCallback( () => {
		setActiveId( null );
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
					<Button variant="link" onClick={ goToSettingsTab }>
						{ __( 'Edit settings', 'jetpack-podcast' ) }
					</Button>
				</Notice>
			) }

			<Card className="podcast__card">
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
												onClick={ () => setActiveId( app.id ) }
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

			{ activeApp && <ActiveModal app={ activeApp } feedUrl={ feedUrl } onClose={ handleClose } /> }
		</>
	);
};

export default DistributionTab;
