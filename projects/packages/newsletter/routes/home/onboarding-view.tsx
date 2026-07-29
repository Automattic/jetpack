import useConnection from '@automattic/jetpack-connection/use-connection';
import { isSimpleSite } from '@automattic/jetpack-script-data';
import apiFetch from '@wordpress/api-fetch';
import {
	Icon,
	__experimentalItem as Item, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalItemGroup as ItemGroup, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { createInterpolateElement, useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	border,
	chevronRight,
	envelope,
	external,
	link,
	published,
	upload,
} from '@wordpress/icons';
import { Button, Card, Stack, Text } from '@wordpress/ui';
import ShareNewsletterModal from '../../_inc/share/share-newsletter-modal';
import { getAddSubscribersUrl } from '../../_inc/subscribers/lib/add-subscribers-link';
import { getNewsletterModeScriptData } from '../../src/settings/script-data';
import { getGreeting } from './greeting';
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
	/** Ids of the checklist tasks this user has already ticked off. */
	completed: string[];
};

/**
 * An entry point either goes somewhere (`href`), does something in place
 * (`onClick`), or does neither — in which case it renders as plain content, so
 * nothing advertises an affordance it doesn't have.
 */
type EntryPointAction = {
	href?: string;
	onClick?: () => void;
	/** Whether `href` leaves wp-admin, and so should open in a new tab. */
	isExternal?: boolean;
};

type ActionTile = EntryPointAction & {
	icon: JSX.Element;
	title: string;
	description: string;
};

/**
 * Stable ids for the checklist rows. Completion is stored against these rather
 * than titles, which are translated and still being reworded. Mirrors
 * `Mode::CHECKLIST_TASKS`, which is the REST enum the server validates against.
 */
const TASK_IDS = {
	startNewsletter: 'start-newsletter',
	makeItYours: 'make-it-yours',
	writeFirstPost: 'write-first-post',
	growAudience: 'grow-audience',
	paidSubscriptions: 'paid-subscriptions',
} as const;

type ChecklistTask = EntryPointAction & {
	id: string;
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
 * The getting-started checklist. Completion is recorded when a row is clicked
 * rather than detected from site state — a stand-in until the tasks can be
 * derived from what the site actually has.
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
		id: TASK_IDS.startNewsletter,
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
		// True the moment the site exists, so this row is never clicked and
		// carries no id in the completable set.
		done: true,
	},
	{
		id: TASK_IDS.makeItYours,
		title: __( 'Make it yours', 'jetpack-newsletter' ),
		description: __( 'Customize the name, tagline, and more.', 'jetpack-newsletter' ),
		done: options.completed.includes( TASK_IDS.makeItYours ),
		// The Settings tab, where Newsletter identity is the first section — so
		// the title and tagline this row promises are already in view on arrival.
		href: getNewsletterModeScriptData()?.settingsUrl,
	},
	{
		id: TASK_IDS.writeFirstPost,
		title: __( 'Write your first post', 'jetpack-newsletter' ),
		description: __( 'Three sentences is enough. Start small.', 'jetpack-newsletter' ),
		done: options.completed.includes( TASK_IDS.writeFirstPost ),
		// Same destination as the nav's "Write" button — `Mode::get_write_url()`
		// resolves both, so they can't drift apart.
		href: getNewsletterModeScriptData()?.writeUrl,
	},
	{
		id: TASK_IDS.growAudience,
		title: __( 'Grow your audience', 'jetpack-newsletter' ),
		description: __( 'Invite the people most likely to support you.', 'jetpack-newsletter' ),
		done: options.completed.includes( TASK_IDS.growAudience ),
		href: options.canAddSubscribers ? getAddSubscribersUrl( 'manual' ) : undefined,
	},
	{
		id: TASK_IDS.paidSubscriptions,
		title: __( 'Set up paid subscriptions', 'jetpack-newsletter' ),
		description: __(
			'Offer subscriber-only content and start earning from your newsletter.',
			'jetpack-newsletter'
		),
		done: options.completed.includes( TASK_IDS.paidSubscriptions ),
		// The same WordPress.com Earn screen the nav's Monetize item opens —
		// `Mode::get_monetize_url()` resolves both, so they can't drift apart.
		href: getNewsletterModeScriptData()?.monetizeUrl,
		isExternal: true,
	},
];

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
 * stay plain list items. A row that leaves wp-admin opens in a new tab, with
 * `rel` so the opened page can't reach back through `window.opener`, and trades
 * the chevron for the new-window glyph so the trailing indicator matches where
 * the row actually goes.
 *
 * @param props            - Component props.
 * @param props.task       - The task to render.
 * @param props.onActivate - Records the row as complete when it is followed.
 * @return The checklist row.
 */
const ChecklistRow = ( {
	task,
	onActivate,
}: {
	task: ChecklistTask;
	onActivate: ( task: ChecklistTask ) => void;
} ): JSX.Element => {
	const handleClick = useCallback( () => {
		onActivate( task );
		if ( ! task.href ) {
			task.onClick?.();
		}
	}, [ onActivate, task ] );

	return (
		<Item
			className="jetpack-newsletter-home__task"
			{ ...( task.href
				? {
						as: 'a' as const,
						href: task.href,
						...( task.isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {} ),
				  }
				: {} ) }
			// Only rows that actually do something get a handler: `Item` renders as
			// a button the moment it has one, and a row with no destination must not
			// advertise an affordance it doesn't have.
			onClick={ task.href || task.onClick ? handleClick : undefined }
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
						{ task.isExternal && (
							// The icon alone warns sighted visitors that the row leaves
							// wp-admin; this says so for everyone else.
							<span className="screen-reader-text">
								{ __( '(opens in a new tab)', 'jetpack-newsletter' ) }
							</span>
						) }
					</Text>
					<Text variant="body-sm" className="jetpack-newsletter-home__muted">
						{ task.description }
					</Text>
				</Stack>
				{ /* One trailing indicator per row, shaped to where the row goes. The
			     external glyph is keyed on `isExternal` rather than on completion,
			     so a row that leaves wp-admin keeps saying so even once it is
			     ticked off. */ }
				{ task.isExternal ? (
					<Icon
						icon={ external }
						size={ 24 }
						className="jetpack-newsletter-home__task-chevron is-external"
					/>
				) : (
					! task.done && (
						<Icon
							icon={ chevronRight }
							size={ 24 }
							className="jetpack-newsletter-home__task-chevron"
						/>
					)
				) }
			</Stack>
		</Item>
	);
};

/**
 * The onboarding view — greeting, the "Reach your first 3 readers" card, and
 * the getting-started checklist. What the Dashboard shows before a newsletter
 * has an audience; {@link StatsView} is what it becomes after.
 *
 * Resolves what the data builders can't: whether this site can manage
 * subscribers, and whether there's a URL to share — which between them decide
 * which entry points get a destination. Also owns the Share modal, which unlike
 * Add Subscribers has no other page to link to.
 *
 * @return The onboarding content.
 */
export const OnboardingView = (): JSX.Element => {
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

	// Seeded the same way, so progress is on screen from the first paint.
	const [ completed, setCompleted ] = useState< string[] >(
		() => getNewsletterModeScriptData()?.checklistCompleted ?? []
	);

	// Following a row ticks it off. Completion isn't derived from site state yet,
	// so the click is what we have — see getChecklist().
	const completeTask = useCallback( ( task: ChecklistTask ) => {
		if ( task.done ) {
			return;
		}

		// Tick it immediately, and put it back if the write fails rather than
		// leave the page disagreeing with what the next load will show.
		setCompleted( previous =>
			previous.includes( task.id ) ? previous : [ ...previous, task.id ]
		);

		apiFetch( {
			path: '/jetpack-newsletter/v1/checklist-completed',
			method: 'POST',
			data: { task: task.id },
			// These rows navigate as they are clicked, and an in-flight request is
			// torn down when the page unloads — which would drop the tick that was
			// just shown. `keepalive` hands the request to the browser to finish
			// on its own, so the row does not have to be held back to save it.
			keepalive: true,
		} ).catch( () => setCompleted( previous => previous.filter( id => id !== task.id ) ) );
	}, [] );

	const siteUrl = getNewsletterModeScriptData()?.siteUrl;
	const options: EntryPointOptions = {
		canAddSubscribers,
		onShare: siteUrl ? openShare : undefined,
		siteUrl,
		siteHost: getSiteHost( siteUrl ),
		completed,
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
							<ChecklistRow key={ task.id } task={ task } onActivate={ completeTask } />
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
