import AdminPage from '@automattic/jetpack-components/admin-page';
import HighlightBanner from '@automattic/jetpack-components/highlight-banner';
import { Button } from '@wordpress/components';
import { __, isRTL, sprintf } from '@wordpress/i18n';
import {
	audio,
	backup,
	chevronLeft,
	chevronRight,
	currencyDollar,
	globe,
	info,
	trendingUp,
} from '@wordpress/icons';
import { EmptyState, Icon, Link, Stack, Text } from '@wordpress/ui';
import { useEffect, useMemo } from 'react';
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
import { recordEvent, recordLinkClick } from './tracks.ts';
import type { InitialState, Tool } from './types.ts';
import type { MouseEvent, ReactElement } from 'react';

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
 * Which section each known tool sits in, by icon key. Anything else goes under "More".
 */
const SECTION_OF: Record< string, string > = {
	'activity-log': 'security',
	'akismet-key-config': 'security',
	backup: 'security',
	scan: 'security',
	advertising: 'growth',
	earn: 'growth',
	newsletter: 'growth',
	social: 'growth',
	'marketing/traffic': 'growth',
	seo: 'growth',
	'forms-admin': 'content',
	'forms-responses-wp-admin': 'content',
	podcast: 'content',
	search: 'content',
	videopress: 'content',
};

/**
 * The sections, in page order.
 *
 * @return Each section's key, title and blurb.
 */
function getSections() {
	return [
		{
			key: 'security',
			title: __( 'Security', 'jetpack-mu-wpcom' ),
			blurb: __( 'Keep your site and its visitors safe.', 'jetpack-mu-wpcom' ),
		},
		{
			key: 'growth',
			title: __( 'Growth', 'jetpack-mu-wpcom' ),
			blurb: __( 'Bring in visitors and earn from your content.', 'jetpack-mu-wpcom' ),
		},
		{
			key: 'content',
			title: __( 'Content', 'jetpack-mu-wpcom' ),
			blurb: __( 'Collect, publish and find what is on your site.', 'jetpack-mu-wpcom' ),
		},
		{
			key: 'more',
			title: __( 'More', 'jetpack-mu-wpcom' ),
			blurb: __( 'Other Jetpack tools on this site.', 'jetpack-mu-wpcom' ),
		},
	];
}

/**
 * One tool in the list, laid out like a card on My Jetpack's Features tab.
 *
 * @param props         - Component props.
 * @param props.tool    - The tool.
 * @param props.section - Key of the section the card sits in.
 * @return The rendered card.
 */
function ToolCard( { tool, section }: { tool: Tool; section: string } ) {
	const chevron = isRTL() ? chevronLeft : chevronRight;

	return (
		<Link
			className="wpcom-my-jetpack__tool"
			variant="unstyled"
			href={ tool.url }
			onClick={ event =>
				recordLinkClick( event, 'wpcom_my_jetpack_tool_clicked', {
					tool: tool.icon || 'other',
					section,
				} )
			}
		>
			<Stack direction="row" gap="md" align="flex-start">
				<span className="wpcom-my-jetpack__tool-icon" aria-hidden="true">
					<Icon icon={ ICONS[ tool.icon ] ?? jetpack } size={ 20 } />
				</span>
				<Stack className="wpcom-my-jetpack__tool-text" direction="column" gap="xs">
					<Text variant="heading-lg" className="wpcom-my-jetpack__tool-title">
						{ tool.title }
					</Text>
					{ tool.description && (
						<Text variant="body-md" className="wpcom-my-jetpack__tool-description">
							{ tool.description }
						</Text>
					) }
				</Stack>
				<span className="wpcom-my-jetpack__tool-arrow" aria-hidden="true">
					<Icon icon={ chevron } size={ 24 } />
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
	const sections = useMemo(
		() =>
			getSections()
				.map( section => ( {
					...section,
					tools: tools.filter( tool => ( SECTION_OF[ tool.icon ] ?? 'more' ) === section.key ),
				} ) )
				.filter( section => section.tools.length ),
		[ tools ]
	);

	useEffect( () => {
		recordEvent( 'wpcom_my_jetpack_page_viewed', { tool_count: tools.length } );
	}, [ tools.length ] );

	return (
		<AdminPage title={ __( 'My Jetpack', 'jetpack-mu-wpcom' ) } unwrapped>
			{ /* AdminPage's layout restyles the page's direct child and that child's children, so the grids sit one level below them. */ }
			<div className="wpcom-my-jetpack__body">
				<Stack direction="column" gap="2xl">
					<HighlightBanner
						title={ __( 'Jetpack is built into your site', 'jetpack-mu-wpcom' ) }
						description={ __(
							'Jetpack is made by Automattic, the team behind WordPress.com, and millions of WordPress sites rely on it. Here it comes built in, with nothing to install, update or connect, including an AI assistant in the editor that helps you write and edit posts. Your plan decides which tools you get, and paid plans add more, like backups, security scanning and ad revenue.',
							'jetpack-mu-wpcom'
						) }
						actions={
							plan && (
								<>
									<Button
										className="jp-highlight-banner__cta"
										variant="primary"
										href={ plan.url }
										onClick={ ( event: MouseEvent< HTMLAnchorElement > ) =>
											recordLinkClick( event, 'wpcom_my_jetpack_compare_plans_clicked', {
												plan: plan.name,
											} )
										}
									>
										{ __( 'Compare plans', 'jetpack-mu-wpcom' ) }
									</Button>
									{ plan.name && (
										<span className="wpcom-my-jetpack__plan">
											{ sprintf(
												/* translators: %s: the name of the site's WordPress.com plan, such as Free or Premium. */
												__( 'You’re on the %s plan.', 'jetpack-mu-wpcom' ),
												plan.name
											) }
										</span>
									) }
								</>
							)
						}
					/>
					{ sections.length ? (
						sections.map( section => (
							<Stack key={ section.key } render={ <section /> } direction="column" gap="md">
								<Stack direction="column" gap="xs">
									<Text variant="heading-md" render={ <h2 /> }>
										{ section.title }
									</Text>
									<Text variant="body-md" className="wpcom-my-jetpack__blurb">
										{ section.blurb }
									</Text>
								</Stack>
								<div className="wpcom-my-jetpack__tools">
									{ section.tools.map( tool => (
										<ToolCard key={ tool.url } tool={ tool } section={ section.key } />
									) ) }
								</div>
							</Stack>
						) )
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
				</Stack>
			</div>
		</AdminPage>
	);
}
