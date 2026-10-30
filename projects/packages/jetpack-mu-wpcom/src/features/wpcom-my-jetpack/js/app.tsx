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
	info,
	trendingUp,
} from '@wordpress/icons';
import { EmptyState, Icon, Link, Stack, Text, VisuallyHidden } from '@wordpress/ui';
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
	'akismet-key-config': akismet,
	backup: cloud,
	advertising: blaze,
	'forms-admin': forms,
	'forms-responses-wp-admin': forms,
	earn: currencyDollar,
	newsletter,
	podcast: audio,
	scan,
	search,
	seo: globe,
	social,
	'marketing/traffic': trendingUp,
	videopress,
};

/**
 * One tool in the list, laid out like a card on My Jetpack's Features tab.
 *
 * @param props      - Component props.
 * @param props.tool - The tool.
 * @return The rendered card.
 */
function ToolCard( { tool }: { tool: Tool } ) {
	const chevron = isRTL() ? chevronLeft : chevronRight;

	return (
		<Link className="wpcom-my-jetpack__tool" variant="unstyled" href={ tool.url }>
			<Stack direction="row" gap="md" align="flex-start">
				<span className="wpcom-my-jetpack__tool-icon" aria-hidden="true">
					<Icon icon={ ICONS[ tool.icon ] ?? jetpack } size={ 20 } />
				</span>
				<Stack className="wpcom-my-jetpack__tool-text" direction="column" gap="xs">
					<Text variant="heading-lg" className="wpcom-my-jetpack__tool-title">
						{ tool.title }
						{ tool.external && (
							<VisuallyHidden>
								{ ' ' }
								{ __( '(opens on WordPress.com)', 'jetpack-mu-wpcom' ) }
							</VisuallyHidden>
						) }
					</Text>
					{ tool.description && (
						<Text variant="body-md" className="wpcom-my-jetpack__tool-description">
							{ tool.description }
						</Text>
					) }
				</Stack>
				<span className="wpcom-my-jetpack__tool-arrow" aria-hidden="true">
					<Icon icon={ tool.external ? arrowUpRight : chevron } size={ 24 } />
				</span>
			</Stack>
		</Link>
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
					{ tools.length ? (
						<div className="wpcom-my-jetpack__tools">
							{ tools.map( tool => (
								<ToolCard key={ tool.url } tool={ tool } />
							) ) }
						</div>
					) : (
						<EmptyState.Root>
							<EmptyState.Icon icon={ info } />
							<EmptyState.Title render={ <h2 /> }>
								{ __( 'No Jetpack tools to show', 'jetpack-mu-wpcom' ) }
							</EmptyState.Title>
							<EmptyState.Description>
								{ __(
									'Your account doesn’t have access to any Jetpack tools on this site.',
									'jetpack-mu-wpcom'
								) }
							</EmptyState.Description>
						</EmptyState.Root>
					) }
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
