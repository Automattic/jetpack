import AdminPage from '@automattic/jetpack-components/admin-page';
import { __, sprintf } from '@wordpress/i18n';
import {
	arrowUpRight,
	audio,
	backup,
	chevronRight,
	currencyDollar,
	globe,
	trendingUp,
} from '@wordpress/icons';
import { Card, Icon, Link, Stack, Text, VisuallyHidden } from '@wordpress/ui';
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
 * One tool in the list, linking to wherever the menu sends it.
 *
 * @param props      - Component props.
 * @param props.tool - The tool.
 * @return The rendered link.
 */
function ToolLink( { tool }: { tool: Tool } ) {
	return (
		<Link className="wpcom-my-jetpack__tool" variant="unstyled" href={ tool.url }>
			<Card.Root className="wpcom-my-jetpack__tool-card">
				<Card.Content>
					<Stack direction="row" gap="md" align="center">
						<span className="wpcom-my-jetpack__tool-icon">
							<Icon icon={ ICONS[ tool.icon ] ?? jetpack } size={ 24 } />
						</span>
						<Stack className="wpcom-my-jetpack__tool-text" direction="column">
							<Text variant="heading-sm">{ tool.title }</Text>
							{ tool.description && <Text variant="body-sm">{ tool.description }</Text> }
						</Stack>
						{ tool.external && (
							<VisuallyHidden>
								{ __( '(opens on WordPress.com)', 'jetpack-mu-wpcom' ) }
							</VisuallyHidden>
						) }
						<Icon icon={ tool.external ? arrowUpRight : chevronRight } size={ 20 } />
					</Stack>
				</Card.Content>
			</Card.Root>
		</Link>
	);
}

/**
 * The lightweight My Jetpack page for WordPress.com Simple sites.
 *
 * @return The rendered page.
 */
export function App() {
	const { domain, tools, plan }: InitialState = window.wpcomMyJetpackInitialState ?? {
		domain: '',
		tools: [],
		plan: null,
	};

	return (
		<AdminPage title={ __( 'My Jetpack', 'jetpack-mu-wpcom' ) } subTitle={ domain } unwrapped>
			<Stack className="wpcom-my-jetpack__body" direction="column" gap="lg">
				<div className="wpcom-my-jetpack__tools">
					{ tools.map( tool => (
						<ToolLink key={ tool.url } tool={ tool } />
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
		</AdminPage>
	);
}
