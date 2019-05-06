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
import QuerySite from 'components/data/query-site';
import { getSiteID } from 'state/site';

function ChecklistProgressCard( { siteId } ) {
	if ( ! siteId ) {
		return <QuerySite />;
	}
	const progressText = '👋';
	const completed = 3;
	const total = 10;
	return (
		<Card compact>
			<QuerySite />
			<div className="checklist__header-main">
				<div className="checklist__header-progress">
					<h2 className="checklist__header-progress-text">{ progressText }</h2>
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
		</Card>
	);
}

export default connect( state => ( {
	siteId: getSiteID( state ),
} ) )( ChecklistProgressCard );
