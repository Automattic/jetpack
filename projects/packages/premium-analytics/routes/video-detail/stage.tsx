/**
 * External dependencies
 */
import { AnalyticsQueryClientProvider, GlobalErrorProvider } from '@jetpack-premium-analytics/data';
import { useDashboardLink } from '@jetpack-premium-analytics/routing';
import { Breadcrumbs, Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { useParams } from '@wordpress/route';
import { Text } from '@wordpress/ui';
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
	const title = summary.isLoading
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
