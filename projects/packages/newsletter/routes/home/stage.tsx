import AdminPage from '@automattic/jetpack-components/admin-page';
import { getSiteData } from '@automattic/jetpack-script-data';
import {
	Icon,
	__experimentalItem as Item, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalItemGroup as ItemGroup, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { border, chevronRight, envelope, link, published, upload } from '@wordpress/icons';
import { Card, Stack, Text } from '@wordpress/ui';
import './route.scss';

/**
 * Newsletter Mode "Dashboard" page.
 *
 * NOTE: everything below the AdminPage title is still a preview of the day-one
 * dashboard design — placeholder copy, no data wiring, and no destinations
 * behind the tiles or checklist rows. The chrome is real, though: it is built
 * from the design-system components (`Card`, `Stack`, `Text` from
 * `@wordpress/ui`, `ItemGroup`/`Item`/`Icon` from `@wordpress/components`), so
 * wiring it up later is a matter of adding handlers rather than rewriting the
 * markup.
 *
 * @return Stage content.
 */

type ActionTile = {
	icon: JSX.Element;
	title: string;
	description: string;
};

type ChecklistTask = {
	title: string;
	description: string;
	done: boolean;
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
	},
	{
		title: __( 'Share your newsletter', 'jetpack-newsletter' ),
		description: __( "Invite the people you'd text first.", 'jetpack-newsletter' ),
		done: false,
	},
];

/**
 * One of the three action tiles inside the "Reach your first 3 readers" card.
 *
 * Presentational for now. Once an action has somewhere to go, `Card.Root` takes
 * a `render` prop — `render={ <button type="button" /> }` turns the whole tile
 * into a button without adding a wrapper element.
 *
 * @param props      - Component props.
 * @param props.tile - The tile to render.
 * @return The tile card.
 */
const ActionTileCard = ( { tile }: { tile: ActionTile } ): JSX.Element => (
	<Card.Root className="jetpack-newsletter-home__tile">
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
 * Presentational for now — passing `onClick` to `Item` renders it as a real
 * `<button>` with the hover and focus treatment already built in, so wiring a
 * task up is a one-prop change.
 *
 * @param props      - Component props.
 * @param props.task - The task to render.
 * @return The checklist row.
 */
const ChecklistRow = ( { task }: { task: ChecklistTask } ): JSX.Element => (
	<Item className="jetpack-newsletter-home__task">
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
 * @return The dashboard content.
 */
const Dashboard = (): JSX.Element => (
	<Stack direction="column" gap="xl" className="jetpack-newsletter-home">
		<Text variant="heading-2xl" render={ <h1 /> }>
			{ __( 'Welcome, Zara', 'jetpack-newsletter' ) }
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
							<ActionTileCard key={ tile.title } tile={ tile } />
						) ) }
					</Stack>
				</Stack>
			</Card.Content>
		</Card.Root>

		<ItemGroup isBordered isRounded isSeparated className="jetpack-newsletter-home__checklist">
			{ getChecklist().map( task => (
				<ChecklistRow key={ task.title } task={ task } />
			) ) }
		</ItemGroup>
	</Stack>
);

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
