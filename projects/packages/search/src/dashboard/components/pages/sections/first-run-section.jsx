import { IndeterminateProgressBar, ThemeProvider } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import PlanSummary from './plan-summary';

const FirstRunSection = ( { planInfo, siteTitle } ) => {
	return (
		<div className="jp-search-dashboard-wrap jp-search-dashboard-meter-wrap">
			<div className="jp-search-dashboard-row">
				<div className="lg-col-span-2 md-col-span-1 sm-col-span-0"></div>
				<div className="jp-search-dashboard-meter-wrap__content lg-col-span-8 md-col-span-6 sm-col-span-4">
					<PlanSummary planInfo={ planInfo } />
					<ProgressWrapper siteTitle={ siteTitle } />
					<NoticeWrapper />
				</div>
				<div className="lg-col-span-2 md-col-span-1 sm-col-span-0"></div>
			</div>
		</div>
	);
};

const ProgressWrapper = ( { siteTitle } ) => {
	return (
		<div>
			<h3>
				{ sprintf(
					// translators: %1$s: site name (not translated)
					__( 'Indexing %1$s', 'jetpack-search-pkg' ),
					siteTitle
				) }
			</h3>
			<ThemeProvider>
				<IndeterminateProgressBar />
			</ThemeProvider>
		</div>
	);
};

const NoticeWrapper = () => (
	<Notice.Root intent="info">
		<Notice.Title>{ __( "We're gathering your usage data.", 'jetpack-search-pkg' ) }</Notice.Title>
		<Notice.Description>
			{ __(
				'If you have recently set up Search, please allow a little time for indexing to complete.',
				'jetpack-search-pkg'
			) }
		</Notice.Description>
	</Notice.Root>
);

export default FirstRunSection;
