import { IndeterminateProgressBar } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import SimpleNotice from 'components/notice';
import React from 'react';
import PlanSummary from './plan-summary';

// import './first-run-section.scss';

const FirstRunSection = props => {
	return (
		<div className="jp-search-dashboard-wrap jp-search-dashboard-meter-wrap">
			<div className="jp-search-dashboard-row">
				<div className="lg-col-span-2 md-col-span-1 sm-col-span-0"></div>
				<div className="jp-search-dashboard-meter-wrap__content lg-col-span-8 md-col-span-6 sm-col-span-4">
					<PlanSummary planInfo={ props.planInfo } />
					<ProgressWrapper siteTitle="YOUR-FUNNY-SITE" />
					<NoticeWrapper />
				</div>
				<div className="lg-col-span-2 md-col-span-1 sm-col-span-0"></div>
			</div>
		</div>
	);
};

const ProgressWrapper = props => {
	return (
		<div>
			<h3>
				{ sprintf(
					// translators: %1$s: site name (not translated)
					__( 'Indexing %1$s', 'jetpack-search-pkg' ),
					props.siteTitle
				) }
			</h3>
			<IndeterminateProgressBar />
		</div>
	);
};

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
