import getRedirectUrl from '@automattic/jetpack-components/tools/jp-redirect';
import { isSimpleSite } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import { ButtonLink, Card, Link, Notice, Stack, Text } from '@wordpress/ui';
import { useCallback } from 'react';
import { getPageData, getSectionState } from '../../data/state';
import { getTabHref, isPlainClick } from '../../data/tabs';
import { trackAdsEvent } from '../../data/tracking';
import { useAdsAccount } from '../../data/wordads';
import type { TabValue } from '../../data/tabs';
import type { UnsafeReason } from '../../data/wordads';
import type { MouseEvent, ReactNode } from 'react';

type OpenTab = ( next: TabValue ) => void;

const UNSAFE_MESSAGES: Record< UnsafeReason, () => string > = {
	mature: () =>
		__(
			'Your site has been identified as serving mature content. Advertisers only want family-friendly sites in the program.',
			'jetpack-monetize'
		),
	spam: () =>
		__(
			'Your site has been identified as serving automatically created or copied content, so it can’t show ads.',
			'jetpack-monetize'
		),
	private: () =>
		__(
			'Your site is private. It needs to be public so that visitors can see the ads.',
			'jetpack-monetize'
		),
	other: () => __( 'Your site can’t take part in the ads program.', 'jetpack-monetize' ),
};

const trackUpgradeClick = () => trackAdsEvent( 'upgrade_click' );

/**
 * What a plan with ads lets the site do, for the cards that start ads.
 *
 * @return The text.
 */
export const START_TEXT = () =>
	__(
		'Top ad suppliers bid against each other to show their ads on your site, maximizing your revenue. Your plan lets you start right away, with no review.',
		'jetpack-monetize'
	);

/**
 * Why WordPress.com won't serve ads on the site, if it says so.
 *
 * @return The notice, or nothing.
 */
export function UnsafeNotice() {
	const { data: account } = useAdsAccount();

	if ( ! account?.unsafe ) {
		return null;
	}

	return (
		<Notice.Root intent="warning">
			<Notice.Description>{ UNSAFE_MESSAGES[ account.unsafe ]() }</Notice.Description>
			{ account.unsafe === 'mature' && (
				<Notice.Actions>
					<Notice.ActionLink href={ getRedirectUrl( 'wordads-family-safe-sites' ) } openInNewTab>
						{ __( 'Learn more', 'jetpack-monetize' ) }
					</Notice.ActionLink>
				</Notice.Actions>
			) }
		</Notice.Root>
	);
}

/**
 * A card that offers the next step toward showing ads.
 *
 * @param props          - Component props.
 * @param props.title    - The card's heading.
 * @param props.children - The message and its action.
 * @return The card.
 */
export function PromptCard( { title, children }: { title: string; children: ReactNode } ) {
	return (
		<Card.Root>
			<Card.Header>
				<Card.Title render={ <h2 /> }>{ title }</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="md" align="start">
					{ children }
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}

/**
 * What a plan with ads brings, and the way to it.
 *
 * @param props                - Component props.
 * @param props.onUpgradeClick - Records the upgrade click.
 * @return The card.
 */
export function UpsellCard( {
	onUpgradeClick = trackUpgradeClick,
}: {
	onUpgradeClick?: () => void;
} ) {
	const { upgradeUrl } = getPageData();

	return (
		<PromptCard title={ __( 'Upgrade and start earning', 'jetpack-monetize' ) }>
			<Text>
				{ __(
					'Make money each time someone visits your site by displaying ads on all your posts and pages.',
					'jetpack-monetize'
				) }
			</Text>
			{ upgradeUrl && (
				<ButtonLink variant="solid" href={ upgradeUrl } onClick={ onUpgradeClick }>
					{ __( 'Upgrade', 'jetpack-monetize' ) }
				</ButtonLink>
			) }
		</PromptCard>
	);
}

/**
 * The way to start showing ads with a plan that includes them, which Settings holds: joining on Simple (owner only), then the switch.
 *
 * @param props         - Component props.
 * @param props.openTab - Opens another of the page's tabs.
 * @return The card.
 */
export function StartCard( { openTab }: { openTab: OpenTab } ) {
	const canJoin = Boolean(
		getSectionState< { canJoinWordAds?: boolean } >( 'ads' )?.canJoinWordAds
	);
	const { data: account } = useAdsAccount();
	// A Simple site that joined and then switched ads off only needs the switch.
	const mustJoin = isSimpleSite() && ! account?.approved;

	const onSetUp = useCallback(
		( event: MouseEvent ) => {
			trackAdsEvent( 'setup_click' );
			if ( isPlainClick( event ) ) {
				event.preventDefault();
				openTab( 'settings' );
			}
		},
		[ openTab ]
	);

	return (
		<PromptCard
			title={
				mustJoin
					? __( 'Join WordAds', 'jetpack-monetize' )
					: __( 'Start earning from ads', 'jetpack-monetize' )
			}
		>
			<Text>{ START_TEXT() }</Text>
			{ mustJoin && ! canJoin && (
				<Text>{ __( 'Only the site owner can join WordAds.', 'jetpack-monetize' ) }</Text>
			) }
			{ /* An unsafe site can't join, and UnsafeNotice above says why. */ }
			{ ( ! mustJoin || ( canJoin && ! account?.unsafe ) ) && (
				<Link href={ getTabHref( 'settings' ) } onClick={ onSetUp }>
					{ mustJoin
						? __( 'Join WordAds in Settings', 'jetpack-monetize' )
						: __( 'Turn on ads in Settings', 'jetpack-monetize' ) }
				</Link>
			) }
		</PromptCard>
	);
}
