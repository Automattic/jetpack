import AdminPage from '@automattic/jetpack-components/admin-page';
import useConnection from '@automattic/jetpack-connection/use-connection';
import { getSiteData, isSimpleSite } from '@automattic/jetpack-script-data';
import {
	Icon,
	__experimentalItem as Item, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalItemGroup as ItemGroup, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { border, chevronRight, envelope, link, published, upload } from '@wordpress/icons';
import { Card, Stack, Text } from '@wordpress/ui';
import { getAddSubscribersUrl } from '../../_inc/subscribers/lib/add-subscribers-link';
import { getNewsletterModeScriptData } from '../../src/settings/script-data';
import './route.scss';
import type { AddSubscribersTab } from '../../_inc/subscribers/components/modals/add-subscribers-modal';

type ActionTile = {
	icon: JSX.Element;
	title: string;
	description: string;
	/**
	 * Which Add Subscribers tab this tile links to, when it links anywhere.
	 * Tiles without a tab render as plain cards rather than as links, so nothing
	 * advertises an affordance it doesn't have.
	 */
	importTab?: AddSubscribersTab;
};

type ChecklistTask = {
	title: string;
	description: string;
	done: boolean;
	/**
	 * Which Add Subscribers tab this row links to, if any — same rule as
	 * {@link ActionTile}.
	 */
	importTab?: AddSubscribersTab;
};

/**
 * The three day-one actions offered by the "Reach your first 3 readers" card.
 *
 * A function rather than a module constant so each `__()` runs at render time —
 * at module scope they would resolve before the locale data is in place.
 *
 * @return The action tiles, in display order.
 */
const getActionTiles = (): ActionTile[] => [
	{
		icon: upload,
		title: __( 'Bring your contacts', 'jetpack-newsletter' ),
		description: __( 'Import an existing list', 'jetpack-newsletter' ),
		importTab: 'upload',
	},
	{
		icon: link,
		title: __( 'Share your link', 'jetpack-newsletter' ),
		description: __( 'Paste it anywhere you like', 'jetpack-newsletter' ),
	},
	{
		icon: envelope,
		title: __( 'Invite by email', 'jetpack-newsletter' ),
		description: __( 'Ask a few people directly', 'jetpack-newsletter' ),
		importTab: 'manual',
	},
];

/**
 * The getting-started checklist. Completion is hard-coded until the tasks are
 * backed by real site state.
 *
 * A function rather than a module constant, for the same reason as
 * {@link getActionTiles}.
 *
 * @return The checklist tasks, in display order.
 */
const getChecklist = (): ChecklistTask[] => [
	{
		title: __( 'Your newsletter is live', 'jetpack-newsletter' ),
		description: __( 'octagonal.wordpress.com is ready for the world.', 'jetpack-newsletter' ),
		done: true,
	},
	{
		title: __( 'Make it yours', 'jetpack-newsletter' ),
		description: __( 'Customize the name, description, and more.', 'jetpack-newsletter' ),
		done: false,
	},
	{
		title: __( 'Write your first post', 'jetpack-newsletter' ),
		description: __( 'Three sentences is enough. Start small.', 'jetpack-newsletter' ),
		done: false,
	},
	{
		title: __( 'Bring your first readers', 'jetpack-newsletter' ),
		description: __( "Invite the people you'd usually text first.", 'jetpack-newsletter' ),
		done: false,
		importTab: 'manual',
	},
	{
		title: __( 'Share your newsletter', 'jetpack-newsletter' ),
		description: __( "Invite the people you'd text first.", 'jetpack-newsletter' ),
		done: false,
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
 * One of the three action tiles inside the "Reach your first 3 readers" card.
 *
 * Given an `href` the tile becomes a link through `Card.Root`'s `render` prop,
 * which swaps the underlying element without adding a wrapper — the stylesheet
 * keys the interactive affordances off that element. Tiles without one stay
 * plain cards until they have somewhere to go.
 *
 * @param props      - Component props.
 * @param props.tile - The tile to render.
 * @param props.href - Where the tile goes, when it goes anywhere.
 * @return The tile card.
 */
const ActionTileCard = ( { tile, href }: { tile: ActionTile; href?: string } ): JSX.Element => (
	<Card.Root
		className="jetpack-newsletter-home__tile"
		render={ href ? <a href={ href } /> : undefined }
	>
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
 * Given an `href` the row renders as an anchor — `Item` takes an `as`, and
 * brings the hover and focus treatment with it either way. Rows without one
 * stay plain list items until they have somewhere to go.
 *
 * @param props      - Component props.
 * @param props.task - The task to render.
 * @param props.href - Where the row goes, when it goes anywhere.
 * @return The checklist row.
 */
const ChecklistRow = ( { task, href }: { task: ChecklistTask; href?: string } ): JSX.Element => (
	<Item className="jetpack-newsletter-home__task" { ...( href ? { as: 'a' as const, href } : {} ) }>
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
 * Owns the Add Subscribers modal that the page's three subscriber-adding entry
 * points share. The tab doubles as the open state — null is closed — and the
 * modal is mounted only while open, so each entry point lands on its own tab
 * rather than resuming whichever tab the previous visit left behind.
 *
 * @return The dashboard content.
 */
const Dashboard = (): JSX.Element => {
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

	// The one place the "where does this go, and may we send them there at all"
	// rule lives. An entry point whose tab is gated away gets no href, which
	// leaves it inert rather than pointing at a page that would only refuse.
	const importUrl = ( tab?: AddSubscribersTab ) =>
		tab && canAddSubscribers ? getAddSubscribersUrl( tab ) : undefined;

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
							{ getActionTiles().map( tile => (
								<ActionTileCard
									key={ tile.title }
									tile={ tile }
									href={ importUrl( tile.importTab ) }
								/>
							) ) }
						</Stack>
					</Stack>
				</Card.Content>
			</Card.Root>

			<ItemGroup isBordered isRounded isSeparated className="jetpack-newsletter-home__checklist">
				{ getChecklist().map( task => (
					<ChecklistRow key={ task.title } task={ task } href={ importUrl( task.importTab ) } />
				) ) }
			</ItemGroup>
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
	>
		<div className="jetpack-newsletter-mode-page">
			<Dashboard />
		</div>
	</AdminPage>
);

export { Stage as stage };
