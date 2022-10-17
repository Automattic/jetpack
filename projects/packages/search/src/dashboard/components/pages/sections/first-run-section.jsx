import { IndeterminateProgressBar, ThemeProvider } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import SimpleNotice from 'components/notice';
import React from 'react';
import PlanSummary from './plan-summary';

// import './first-run-section.scss';

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

// TODO: Move this back inline.
// Per Jason's feedback, doesn't think we should break this out.
// https://github.com/Automattic/jetpack/pull/26639#discussion_r989592860
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

// TODO: Remove const variables.
// Per Jason's feedback, thinks we should put these inline.
// https://github.com/Automattic/jetpack/pull/26639#discussion_r989593312
const NoticeWrapper = () => {
	const noticeBoxClassName = 'jp-search-notice-box';
	const header = __( "We're gathering your usage data.", 'jetpack-search-pkg' );
	const message = __(
		'If you have recently set up Search, please allow a little time for indexing to complete.',
		'jetpack-search-pkg'
	);
	return (
		<SimpleNotice
			isCompact={ false }
			status={ 'is-info' }
			className={ noticeBoxClassName }
			icon={ 'info-outline' }
			showDismiss={ false }
		>
			<h3 className="dops-notice__header">{ header }</h3>
			<span className="dops-notice__body">{ message }</span>
		</SimpleNotice>
	);
};

export default FirstRunSection;
