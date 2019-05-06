/**
 * External dependencies
 */
import { translate as __ } from 'i18n-calypso';
import React from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import Card from 'components/card';
import ProgressBar from './progress-bar';
import QueryChecklistProgress from 'components/data/query-checklist-progress';
import QuerySite from 'components/data/query-site';
import { getSiteID } from 'state/site';
import { getTasks } from 'state/checklist/selectors';
import './style.scss';

function ChecklistProgressCard( { completed, total, siteId } ) {
	if ( ! siteId ) {
		return (
			<>
				<QuerySite />
				<QueryChecklistProgress />
			</>
		);
	}

	return (
		<Card compact>
			<QuerySite />
			<QueryChecklistProgress />
			{ completed && total && (
				<>
					<div className="checklist__header-main">
						<div className="checklist__header-progress">
							<h2 className="checklist__header-progress-text">
								{ __( 'Your Jetpack setup progress', {
									comment: 'Onboarding task list progress',
								} ) }
							</h2>
							<span className="checklist__header-progress-number">{ `${ completed }/${ total }` }</span>
						</div>
						<ProgressBar compact canGoBackwards total={ total } value={ completed } />
					</div>
					<div className="checklist__header-secondary">
						<Button primary href={ `wordpress.com/plans/my-plan/${ siteId }` }>
							{ __( 'Complete Jetpack Setup', {
								comment: 'Text on link to list of onboarding tasks',
							} ) }
						</Button>
					</div>
				</>
			) }
		</Card>
	);
}

export default connect( state => {
	const tasks = getTasks( state );
	const completed = tasks
		? Object.keys( tasks ).filter( key => tasks[ key ].completed ).length
		: null;
	const total = tasks ? Object.keys( tasks ).length : null;
	return {
		siteId: getSiteID( state ),
		completed,
		total,
	};
} )( ChecklistProgressCard );
