import AdminPage from '@automattic/jetpack-components/admin-page';
import { __, isRTL, sprintf } from '@wordpress/i18n';
import {
	arrowUpRight,
	audio,
	backup,
	chevronLeft,
	chevronRight,
	currencyDollar,
	globe,
	trendingUp,
} from '@wordpress/icons';
import { Icon, Link, Stack, Text, VisuallyHidden } from '@wordpress/ui';
import {
	akismet,
	blaze,
	cloud,
	forms,
	jetpack,
	newsletter,
	scan,
	search,
	social,
	videopress,
} from './icons.tsx';
import type { InitialState, Tool } from './types.ts';
import type { ReactElement } from 'react';

const ICONS: Record< string, ReactElement > = {
	'activity-log': backup,
	akismet,
	backup: cloud,
	blaze,
	forms,
	monetize: currencyDollar,
	newsletter,
	podcast: audio,
	scan,
	search,
	seo: globe,
	social,
	traffic: trendingUp,
	videopress,
};

/**
 * One tool in the list, laid out like a card on My Jetpack's Features tab.
 *
 * The title carries the link and stretches over the whole card.
 *
 * @param props      - Component props.
 * @param props.tool - The tool.
 * @return The rendered card.
 */
function ToolCard( { tool }: { tool: Tool } ) {
	const chevron = isRTL() ? chevronLeft : chevronRight;

	return (
		<div className="wpcom-my-jetpack__tool">
			<span className="wpcom-my-jetpack__tool-icon" aria-hidden="true">
				<Icon icon={ ICONS[ tool.icon ] ?? jetpack } size={ 20 } />
			</span>
			<span className="wpcom-my-jetpack__tool-text">
				<Text
					variant="heading-lg"
					className="wpcom-my-jetpack__tool-title"
					render={ <Link variant="unstyled" href={ tool.url } /> }
				>
					{ tool.title }
					{ tool.external && (
						<VisuallyHidden>
							{ __( '(opens on WordPress.com)', 'jetpack-mu-wpcom' ) }
						</VisuallyHidden>
					) }
				</Text>
				{ tool.description && (
					<Text variant="body-md" className="wpcom-my-jetpack__tool-description">
						{ tool.description }
					</Text>
				) }
			</span>
			<span className="wpcom-my-jetpack__tool-arrow" aria-hidden="true">
				<Icon icon={ tool.external ? arrowUpRight : chevron } size={ 24 } />
			</span>
		</div>
	);
}

/**
 * The lightweight My Jetpack page for WordPress.com Simple sites.
 *
 * @return The rendered page.
 */
export function App() {
	const { tools, plan }: InitialState = window.wpcomMyJetpackInitialState ?? {
		tools: [],
		plan: null,
	};

	return (
		<AdminPage title={ __( 'My Jetpack', 'jetpack-mu-wpcom' ) } unwrapped>
			{ /* AdminPage's layout restyles the page's direct child and that child's children, so the grid sits one level below them. */ }
			<div className="wpcom-my-jetpack__body">
				<Stack direction="column" gap="lg">
					<div className="wpcom-my-jetpack__tools">
						{ tools.map( tool => (
							<ToolCard key={ tool.url } tool={ tool } />
						) ) }
					</div>
					{ plan && (
						<Stack direction="row" gap="sm" align="center" wrap="wrap">
							{ plan.name && (
								<Text variant="body-md">
									{ sprintf(
										/* translators: %s: the name of the site's WordPress.com plan, such as Free or Premium. */
										__( 'You’re on the %s plan.', 'jetpack-mu-wpcom' ),
										plan.name
									) }
								</Text>
							) }
							<Link href={ plan.url } openInNewTab>
								{ __( 'Compare plans', 'jetpack-mu-wpcom' ) }
							</Link>
						</Stack>
					) }
				</Stack>
			</div>
		</AdminPage>
	);
}
