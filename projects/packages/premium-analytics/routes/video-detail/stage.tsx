/**
 * External dependencies
 */
import { AnalyticsQueryClientProvider, GlobalErrorProvider } from '@jetpack-premium-analytics/data';
import { useDashboardLink } from '@jetpack-premium-analytics/routing';
import { Breadcrumbs, Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { useParams } from '@wordpress/route';
import { Button, Stack, Text } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import { useVideoSummary } from './hooks';
import { route } from './package.json';
import styles from './stage.module.scss';

const ROUTE_FROM = route.path;

/**
 * Premium Analytics video detail page shell.
 *
 * @return The video detail page.
 */
function VideoDetail(): JSX.Element {
	const { videoId: videoIdParam } = useParams( { from: ROUTE_FROM } ) as { videoId?: string };
	const summary = useVideoSummary( Number( videoIdParam ) );
	const dashboardLink = useDashboardLink();
	// On error there is no trustworthy title: the fallback label must not be
	// presented as real data, so the crumb and heading stay empty and the body
	// shows the error state instead.
	const title =
		summary.isLoading || summary.isError
			? undefined
			: summary.title?.trim() || __( 'Untitled video', 'jetpack-premium-analytics' );

	return (
		<Page
			breadcrumbs={
				<Breadcrumbs
					items={ [
						{ label: __( 'Stats', 'jetpack-premium-analytics' ), to: dashboardLink },
						...( title ? [ { label: title } ] : [] ),
					] }
				/>
			}
			className={ styles.page }
		>
			<div className={ styles.content }>
				{ summary.isError ? (
					<Stack direction="column" align="flex-start" gap="sm">
						<Text>
							{ __(
								"We couldn't load this video. Please try again in a moment.",
								'jetpack-premium-analytics'
							) }
						</Text>
						<Button variant="outline" onClick={ summary.refetch }>
							{ __( 'Retry', 'jetpack-premium-analytics' ) }
						</Button>
					</Stack>
				) : null }
				{ title ? (
					<Text variant="heading-xl" render={ <h1 /> }>
						{ title }
					</Text>
				) : null }
			</div>
		</Page>
	);
}

/**
 * Route stage wrapper.
 *
 * @return The video detail page with its data and error providers.
 */
export function stage(): JSX.Element {
	return (
		<AnalyticsQueryClientProvider>
			<GlobalErrorProvider>
				<VideoDetail />
			</GlobalErrorProvider>
		</AnalyticsQueryClientProvider>
	);
}
