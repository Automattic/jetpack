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
import { getSiteRawUrl } from 'state/initial-state';
import { getTasks } from 'state/checklist/selectors';

function ChecklistProgressCard( { completed, total, siteSlug } ) {
	return (
		<Card compact className="checklist__header">
			<QueryChecklistProgress />
			{ completed && total && (
				<>
					<div className="checklist__header-main">
						<div className="checklist__header-progress">
							<span className="checklist__header-progress-text">
								{ __( 'Your Jetpack setup progress', {
									comment: 'Onboarding task list progress',
								} ) }
							</span>
							<span className="checklist__header-progress-number">{ `${ completed }/${ total }` }</span>
						</div>
						<ProgressBar compact canGoBackwards total={ total } value={ completed } />
					</div>
					<div className="checklist__header-secondary">
						<Button compact primary href={ `https://wordpress.com/plans/my-plan/${ siteSlug }` }>
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
		siteSlug: getSiteRawUrl( state ),
		completed,
		total,
	};
} )( ChecklistProgressCard );
