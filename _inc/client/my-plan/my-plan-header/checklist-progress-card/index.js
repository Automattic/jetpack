/**
 * External dependencies
 */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import Button from 'components/button';
import Card from 'components/card';
import getRedirectUrl from 'lib/jp-redirect';
import ProgressBar from './progress-bar';
import QueryChecklistProgress from 'components/data/query-checklist-progress';
import { getSiteRawUrl } from 'state/initial-state';
import { getChecklistCompletion } from 'state/checklist/selectors';

class ChecklistProgressCard extends Component {
	trackCtaClick = () =>
		void analytics.tracks.recordEvent(
			'jetpack_myplan_progresschecklistcta_click',
			this.props.plan
				? {
						plan: this.props.plan,
				  }
				: undefined
		);

	render() {
		const { completed, total, siteSlug } = this.props;
		return (
			<>
				<QueryChecklistProgress />
				{ completed && total && (
					<Card compact className="checklist__header">
						<div className="checklist__header-main">
							<div className="checklist__header-progress">
								<span className="checklist__header-progress-text">
									{ _x(
										'Your Jetpack setup progress',
										'Onboarding task list progress',
										'jetpack'
									) }
								</span>
								<span className="checklist__header-progress-number">{ `${ completed }/${ total }` }</span>
							</div>
							<ProgressBar total={ total } value={ completed } />
						</div>
						<div className="checklist__header-secondary">
							<Button
								compact
								href={ getRedirectUrl( 'calypso-plans-my-plan', { site: siteSlug } ) }
								onClick={ this.trackCtaClick }
								primary
							>
								{ _x(
									'Complete Jetpack Setup',
									'Text on link to list of onboarding tasks',
									'jetpack'
								) }
							</Button>
						</div>
					</Card>
				) }
			</>
		);
	}
}

export default connect( state => {
	return {
		siteSlug: getSiteRawUrl( state ),
		...getChecklistCompletion( state ), // add completed and total
	};
} )( ChecklistProgressCard );
