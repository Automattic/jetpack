import AdminPage from '@automattic/jetpack-components/admin-page';
import useConnection from '@automattic/jetpack-connection/use-connection';
import { getSiteData, isSimpleSite } from '@automattic/jetpack-script-data';
import apiFetch from '@wordpress/api-fetch';
import {
	Icon,
	__experimentalItem as Item, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalItemGroup as ItemGroup, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { createInterpolateElement, useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { border, chevronRight, envelope, link, published, upload } from '@wordpress/icons';
import { Button, Card, Stack, Text } from '@wordpress/ui';
import ShareNewsletterModal from '../../_inc/share/share-newsletter-modal';
import { getAddSubscribersUrl } from '../../_inc/subscribers/lib/add-subscribers-link';
import { getNewsletterModeScriptData } from '../../src/settings/script-data';
import './route.scss';
import type { ReactNode } from 'react';

/**
 * What the page's entry points need in order to resolve a destination. Anything
 * an entry point can't know for itself arrives here.
 */
type EntryPointOptions = {
	/** Whether the site can manage subscribers at all. */
	canAddSubscribers: boolean;
	/** Opens the Share modal, or undefined when there's no URL to share. */
	onShare?: () => void;
	/** The newsletter's public URL, when script data carries one. */
	siteUrl?: string;
	/** {@link siteUrl} reduced to a bare host, for display. */
	siteHost?: string;
};

/**
 * An entry point either goes somewhere (`href`), does something in place
 * (`onClick`), or does neither — in which case it renders as plain content, so
 * nothing advertises an affordance it doesn't have.
 */
type EntryPointAction = {
	href?: string;
	onClick?: () => void;
};

type ActionTile = EntryPointAction & {
	icon: JSX.Element;
	title: string;
	description: string;
};

type ChecklistTask = EntryPointAction & {
	title: string;
	/** Rich rather than plain text: the first row links the site's address. */
	description: ReactNode;
	done: boolean;
};

/**
 * The newsletter's public address as a bare host — what the checklist shows,
 * rather than the full URL with its scheme.
 *
 * @param siteUrl - The public URL from script data, if any.
 * @return The host (e.g. `example.com`), or undefined when there's no usable URL.
 */
const getSiteHost = ( siteUrl: string | undefined ): string | undefined => {
	if ( ! siteUrl ) {
		return undefined;
	}
	try {
		return new URL( siteUrl ).host;
	} catch {
		return undefined;
	}
};

/**
 * The three day-one actions offered by the "Reach your first 3 readers" card.
 *
 * A function rather than a module constant so each `__()` runs at render time —
 * at module scope they would resolve before the locale data is in place.
 *
 * @param options - What the tiles can't resolve for themselves.
 * @return The action tiles, in display order.
 */
const getActionTiles = ( options: EntryPointOptions ): ActionTile[] => [
	{
		icon: upload,
		title: __( 'Bring your contacts', 'jetpack-newsletter' ),
		description: __( 'Import an existing list', 'jetpack-newsletter' ),
		href: options.canAddSubscribers ? getAddSubscribersUrl( 'upload' ) : undefined,
	},
	{
		icon: link,
		title: __( 'Share your link', 'jetpack-newsletter' ),
		description: __( 'Paste it anywhere you like', 'jetpack-newsletter' ),
		onClick: options.onShare,
	},
	{
		icon: envelope,
		title: __( 'Invite by email', 'jetpack-newsletter' ),
		description: __( 'Ask a few people directly', 'jetpack-newsletter' ),
		href: options.canAddSubscribers ? getAddSubscribersUrl( 'manual' ) : undefined,
	},
];

/**
 * The getting-started checklist. Completion is hard-coded until the tasks are
 * backed by real site state.
 *
 * A function rather than a module constant, for the same reason as
 * {@link getActionTiles}.
 *
 * @param options - As for {@link getActionTiles}. Writing a post needs no Jetpack
 *                connection, so that task is never gated.
 * @return The checklist tasks, in display order.
 */
const getChecklist = ( options: EntryPointOptions ): ChecklistTask[] => [
	{
		title: __( 'Start a newsletter', 'jetpack-newsletter' ),
		description: options.siteHost
			? createInterpolateElement(
					sprintf(
						/* translators: %s: the newsletter's public web address, e.g. example.com. */
						__( '<link>%s</link> is ready to share.', 'jetpack-newsletter' ),
						options.siteHost
					),
					{
						link: (
							<a className="jetpack-newsletter-home__task-link" href={ options.siteUrl }>
								{ /* Filled by createInterpolateElement. */ }
							</a>
						),
					}
			  )
			: __( 'Your newsletter is ready to share.', 'jetpack-newsletter' ),
		done: true,
	},
	{
		title: __( 'Make it yours', 'jetpack-newsletter' ),
		description: __( 'Customize the name, tagline, and more.', 'jetpack-newsletter' ),
		done: false,
		// The Settings tab, where Newsletter identity is the first section — so
		// the title and tagline this row promises are already in view on arrival.
		href: getNewsletterModeScriptData()?.settingsUrl,
	},
	{
		title: __( 'Write your first post', 'jetpack-newsletter' ),
		description: __( 'Three sentences is enough. Start small.', 'jetpack-newsletter' ),
		done: false,
		// Same destination as the nav's "Write" button — `Mode::get_write_url()`
		// resolves both, so they can't drift apart.
		href: getNewsletterModeScriptData()?.writeUrl,
	},
	{
		title: __( 'Bring your first readers', 'jetpack-newsletter' ),
		description: __( "Invite the people you'd usually text first.", 'jetpack-newsletter' ),
		done: false,
		href: options.canAddSubscribers ? getAddSubscribersUrl( 'manual' ) : undefined,
	},
	{
		title: __( 'Share your newsletter', 'jetpack-newsletter' ),
		description: __( "Invite the people you'd text first.", 'jetpack-newsletter' ),
		done: false,
		onClick: options.onShare,
	},
];

/**
 * The page greeting. Uses the current user's nickname or first name when their
 * profile has one — `Mode::maybe_add_script_data()` resolves which — and greets
 * them without a name when it doesn't.
 *
 * @return The greeting line.
 */
const getGreeting = (): string => {
	const name = getNewsletterModeScriptData()?.greetingName?.trim();

	if ( ! name ) {
		return __( 'Hey there', 'jetpack-newsletter' );
	}

	return sprintf(
		/* translators: %s: the current user's nickname or first name. */
		__( 'Welcome, %s', 'jetpack-newsletter' ),
		name
	);
};

/**
 * The element an entry point should render as: an anchor when it navigates, a
 * button when it acts in place, and nothing — leaving the caller's default — when
 * it does neither.
 *
 * @param action - The entry point's destination or handler.
 * @return An element for `Card.Root`'s `render` prop, or undefined.
 */
const renderInteractive = ( action: EntryPointAction ): JSX.Element | undefined => {
	if ( action.href ) {
		return <a href={ action.href } />;
	}

	if ( action.onClick ) {
		return <button type="button" onClick={ action.onClick } />;
	}

	return undefined;
};

/**
 * One of the three action tiles inside the "Reach your first 3 readers" card.
 *
 * `Card.Root`'s `render` prop swaps the underlying element without adding a
 * wrapper: an anchor for a tile that navigates, a button for one that acts in
 * place, and the plain card for one that does neither. The stylesheet keys the
 * interactive affordances off those elements.
 *
 * @param props      - Component props.
 * @param props.tile - The tile to render.
 * @return The tile card.
 */
const ActionTileCard = ( { tile }: { tile: ActionTile } ): JSX.Element => (
	<Card.Root className="jetpack-newsletter-home__tile" render={ renderInteractive( tile ) }>
		<Card.Content>
			<Stack direction="column" gap="md" align="flex-start">
				<Icon icon={ tile.icon } size={ 24 } className="jetpack-newsletter-home__tile-icon" />
				<Stack direction="column" gap="xs">
					<Text variant="heading-md" render={ <span /> }>
						{ tile.title }
					</Text>
					<Text variant="body-sm" className="jetpack-newsletter-home__muted">
						{ tile.description }
					</Text>
				</Stack>
			</Stack>
		</Card.Content>
	</Card.Root>
);

/**
 * One checklist row. `ItemGroup` supplies the shared border, the separators and
 * the row padding; `Item` supplies `role="listitem"`.
 *
 * `Item` renders as an anchor given `as="a"` and as a button given an `onClick`,
 * bringing the hover and focus treatment with it either way. Rows with neither
 * stay plain list items.
 *
 * @param props      - Component props.
 * @param props.task - The task to render.
 * @return The checklist row.
 */
const ChecklistRow = ( { task }: { task: ChecklistTask } ): JSX.Element => (
	<Item
		className="jetpack-newsletter-home__task"
		{ ...( task.href ? { as: 'a' as const, href: task.href } : {} ) }
		onClick={ task.href ? undefined : task.onClick }
	>
		<Stack direction="row" align="center" gap="md">
			<Icon
				icon={ task.done ? published : border }
				size={ 24 }
				className={
					task.done
						? 'jetpack-newsletter-home__task-icon is-done'
						: 'jetpack-newsletter-home__task-icon'
				}
			/>
			<Stack direction="column" gap="xs" className="jetpack-newsletter-home__task-text">
				<Text variant="heading-md" render={ <span /> }>
					{ task.title }
				</Text>
				<Text variant="body-sm" className="jetpack-newsletter-home__muted">
					{ task.description }
				</Text>
			</Stack>
			{ ! task.done && (
				<Icon icon={ chevronRight } size={ 24 } className="jetpack-newsletter-home__task-chevron" />
			) }
		</Stack>
	</Item>
);

/**
 * The dashboard body — greeting, the "Reach your first 3 readers" card, and the
 * getting-started checklist.
 *
 * Resolves what the data builders can't: whether this site can manage
 * subscribers, and whether there's a URL to share — which between them decide
 * which entry points get a destination. Also owns the Share modal, which unlike
 * Add Subscribers has no other page to link to.
 *
 * @return The dashboard content.
 */
const Dashboard = (): JSX.Element => {
	const [ isShareOpen, setShareOpen ] = useState( false );
	const { isRegistered, hasConnectedOwner, isUserConnected } = useConnection();

	// Subscriber management proxies to WP.com signed as the current user, so a
	// fully connected site AND user are required. Simple sites are already hosted
	// on WP.com — they never have a Jetpack connection, and the
	// `/wpcom/v2/subscribers/*` endpoints resolve directly to WP.com authenticated
	// by the logged-in user — so the gate never applies to them. Same expression
	// the Subscribers route gates on; worth lifting into a shared helper if a
	// third caller shows up.
	const canAddSubscribers =
		isSimpleSite() || ( isRegistered && hasConnectedOwner && isUserConnected );

	const openShare = useCallback( () => setShareOpen( true ), [] );
	const closeShare = useCallback( () => setShareOpen( false ), [] );

	// Seeded from script data so a returning visitor never sees the checklist
	// flash before a fetch resolves.
	const [ isChecklistDismissed, setChecklistDismissed ] = useState(
		getNewsletterModeScriptData()?.checklistDismissed === true
	);

	// Hide it straight away, then persist. If the write fails, put it back
	// rather than leave the page disagreeing with what the next load will show.
	const dismissChecklist = useCallback( () => {
		setChecklistDismissed( true );
		apiFetch( {
			path: '/jetpack-newsletter/v1/checklist-dismissed',
			method: 'POST',
			data: { dismissed: true },
		} ).catch( () => setChecklistDismissed( false ) );
	}, [] );

	const siteUrl = getNewsletterModeScriptData()?.siteUrl;
	const options: EntryPointOptions = {
		canAddSubscribers,
		onShare: siteUrl ? openShare : undefined,
		siteUrl,
		siteHost: getSiteHost( siteUrl ),
	};

	return (
		<Stack direction="column" gap="xl" className="jetpack-newsletter-home">
			<Text variant="heading-2xl" render={ <h1 /> }>
				{ getGreeting() }
			</Text>

			<Card.Root className="jetpack-newsletter-home__reach">
				<Card.Header>
					<Card.Title>
						<Text variant="heading-lg" render={ <h2 /> }>
							{ __( 'Reach your first 3 readers', 'jetpack-newsletter' ) }
						</Text>
					</Card.Title>
				</Card.Header>
				<Card.Content>
					<Stack direction="column" gap="xl">
						<Text
							variant="body-md"
							render={ <p /> }
							className="jetpack-newsletter-home__muted jetpack-newsletter-home__lede"
						>
							{ __(
								'Writers who reach three readers in their first week almost always keep going. Try starting with people who already know you.',
								'jetpack-newsletter'
							) }
						</Text>
						<Stack direction="row" gap="md" wrap="wrap" className="jetpack-newsletter-home__tiles">
							{ getActionTiles( options ).map( tile => (
								<ActionTileCard key={ tile.title } tile={ tile } />
							) ) }
						</Stack>
					</Stack>
				</Card.Content>
			</Card.Root>

			{ ! isChecklistDismissed && (
				<div className="jetpack-newsletter-home__checklist-card">
					<div className="jetpack-newsletter-home__checklist-header">
						<Text variant="heading-lg" render={ <h2 /> }>
							{ __( 'Getting started', 'jetpack-newsletter' ) }
						</Text>
						<Button
							variant="unstyled"
							className="jetpack-newsletter-home__checklist-dismiss"
							onClick={ dismissChecklist }
						>
							{ __( 'Dismiss', 'jetpack-newsletter' ) }
						</Button>
					</div>
					<ItemGroup isSeparated className="jetpack-newsletter-home__checklist">
						{ getChecklist( options ).map( task => (
							<ChecklistRow key={ task.title } task={ task } />
						) ) }
					</ItemGroup>
				</div>
			) }

			{ isShareOpen && siteUrl && (
				<ShareNewsletterModal siteUrl={ siteUrl } onClose={ closeShare } />
			) }
		</Stack>
	);
};

/**
 * Newsletter Mode "Dashboard" page.
 *
 * NOTE: much of what sits below the AdminPage title is still a preview of the
 * day-one dashboard design — placeholder copy, and no destinations behind most
 * of it. The three subscriber-adding entry points are live: they link to the
 * Subscribers page with its Add Subscribers modal open on the tab that matches
 * what the copy promised — CSV upload for "Bring your contacts", the manual
 * address list for "Invite by email" and "Bring your first readers". See
 * `getAddSubscribersUrl()` for why they link rather than render that modal here.
 *
 * @return Stage content.
 */
const Stage = (): JSX.Element => (
	<AdminPage
		apiRoot={ getSiteData()?.rest_root }
		apiNonce={ getSiteData()?.rest_nonce }
		title={ __( 'Dashboard', 'jetpack-newsletter' ) }
		subTitle={ __(
			'Expand your reach, engage readers, and monetize your writing.',
			'jetpack-newsletter'
		) }
		// The mode's own nav is the frame here, so the Jetpack footer would be
		// out of place. This page only ever renders inside the mode, so it needs
		// no condition — unlike the Newsletter page, which is shared.
		showFooter={ false }
	>
		<div className="jetpack-newsletter-mode-page">
			<Dashboard />
		</div>
	</AdminPage>
);

export { Stage as stage };
