/**
 * Distribution tab — copy-the-feed CTA + per-directory submit buttons.
 *
 * Mirrors `client/my-sites/podcast/components/distribution.tsx` from Calypso.
 * Replaces Calypso's `ClipboardButtonInput` with a small inline copy button so
 * we don't pull in any Calypso-only components, and reads the feed URL from
 * the script data injected by `class-settings.php` (the same URL produced by
 * `get_term_feed_link()`).
 */

import {
	Button,
	Card,
	CardBody,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalText as Text,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useCopyToClipboard } from '@wordpress/compose';
import { useCallback, useState, type ComponentType } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { check, copy } from '@wordpress/icons';
import {
	LogoAmazon,
	LogoApple,
	LogoPocketCasts,
	LogoPodcastIndex,
	LogoSpotify,
	LogoYouTube,
} from '../components/logos';
import SubmitModal from '../components/submit-modal';
import { usePodcastSettings } from '../hooks/use-podcast-settings';
import { getPodcastScriptData } from '../script-data';
import type { PodcatcherId } from '../types';
import type { FocusEvent } from 'react';

interface Directory {
	id: PodcatcherId;
	name: string;
	submitUrl: string;
	learnMoreUrl?: string;
	Logo: ComponentType;
}

const DIRECTORIES: Directory[] = [
	{
		id: 'pocketcasts',
		name: 'Pocket Casts',
		submitUrl: 'https://pocketcasts.com/submit',
		learnMoreUrl: 'https://support.pocketcasts.com/knowledge-base/submitting-podcasts/',
		Logo: LogoPocketCasts,
	},
	{
		id: 'apple',
		name: 'Apple Podcasts',
		submitUrl: 'https://podcastsconnect.apple.com/',
		learnMoreUrl: 'https://podcasters.apple.com/support/897-submit-a-show',
		Logo: LogoApple,
	},
	{
		id: 'spotify',
		name: 'Spotify',
		submitUrl: 'https://creators.spotify.com/',
		learnMoreUrl:
			'https://support.spotify.com/creators/article/claiming-your-podcast-on-spotify-for-creators/',
		Logo: LogoSpotify,
	},
	{
		id: 'youtube',
		name: 'YouTube',
		submitUrl: 'https://studio.youtube.com',
		learnMoreUrl: 'https://support.google.com/youtube/answer/13973017',
		Logo: LogoYouTube,
	},
	{
		id: 'amazon',
		name: 'Amazon Music',
		submitUrl: 'https://podcasters.amazon.com',
		Logo: LogoAmazon,
	},
	{
		id: 'podcastindex',
		name: 'Podcast Index',
		submitUrl: 'https://podcastindex.org/add',
		Logo: LogoPodcastIndex,
	},
];

const selectOnFocus = ( event: FocusEvent< HTMLInputElement > ) => {
	event.currentTarget.select();
};

// Pre-resolved so the i18n-check-webpack-plugin validator sees two distinct
// __() calls in the bundled output instead of __(cond?'a':'b'). Hoisted out of
// the component since these strings don't depend on props or state.
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

interface DirectoryRowProps {
	directory: Directory;
	isEnabled: boolean;
	onSelect: ( id: PodcatcherId ) => void;
}

const DirectoryRow = ( { directory, isEnabled, onSelect }: DirectoryRowProps ) => {
	const handleClick = useCallback( () => {
		onSelect( directory.id );
	}, [ directory.id, onSelect ] );

	const { Logo } = directory;

	return (
		<HStack as="li" alignment="center" justify="space-between" className="podcast__directory-row">
			<HStack alignment="center" spacing={ 4 } expanded={ false }>
				<span aria-hidden="true">
					<Logo />
				</span>
				<Text weight={ 500 }>{ directory.name }</Text>
			</HStack>
			<Button variant="primary" size="compact" onClick={ handleClick } disabled={ ! isEnabled }>
				{ __( 'Submit', 'jetpack-podcast' ) }
			</Button>
		</HStack>
	);
};

const DistributionTab = () => {
	const { data: settings } = usePodcastSettings();
	const scriptData = getPodcastScriptData();
	const feedUrl = scriptData.feedUrl;
	const isEnabled = !! settings?.podcasting_category_id;

	const [ activeId, setActiveId ] = useState< PodcatcherId | null >( null );
	const activeDirectory = DIRECTORIES.find( d => d.id === activeId ) ?? null;

	const handleSelect = useCallback( ( id: PodcatcherId ) => {
		setActiveId( id );
	}, [] );

	const handleClose = useCallback( () => {
		setActiveId( null );
	}, [] );

	return (
		<>
			<header className="podcast__section-header">
				<h2 className="podcast__section-heading">{ __( 'Distribution', 'jetpack-podcast' ) }</h2>
				<p className="podcast__section-description">
					{ __(
						'Submit your feed to podcast directories and track where your show is listed.',
						'jetpack-podcast'
					) }
				</p>
			</header>

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
								{ DIRECTORIES.map( directory => (
									<DirectoryRow
										key={ directory.id }
										directory={ directory }
										isEnabled={ isEnabled }
										onSelect={ handleSelect }
									/>
								) ) }
							</VStack>
						</VStack>
					</VStack>
				</CardBody>
			</Card>

			{ activeDirectory && (
				<SubmitModal
					feedUrl={ feedUrl }
					podcatcher={ {
						id: activeDirectory.id,
						name: activeDirectory.name,
						submitUrl: activeDirectory.submitUrl,
						learnMoreUrl: activeDirectory.learnMoreUrl,
					} }
					onClose={ handleClose }
				/>
			) }
		</>
	);
};

export default DistributionTab;
