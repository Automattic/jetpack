/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { getSiteConnectionStatus } from 'state/connection';
import { PlanCard, PlanCardHeader, PlanCardBody } from './plan-card';
import PlanGrid from './plan-grid';
import QuerySite from 'components/data/query-site';

export class Plans extends React.Component {
	render() {
		// TODO: remove
		// const planType = 'is-backup-daily-plan';
		// const className = classNames(
		// 	'plan-features__table-item',
		// 	'is-header',
		// 	'has-border-top',
		// 	`is-${ planType }-plan`
		// );
		return (
			<>
				<QuerySite />
				<h1 className="plans-section__header">Single Products</h1>
				<h2 className="plans-section__subheader">
					Just looking for backups? We've got you covered.
				</h2>
				{ /* TODO: remove
                    <div key={ 'plan-header-' + planType } className={ className }>
					<header className="plan-features__header">
						<h3 className="plan-features__header-title">TITLE</h3>
						<div className="plan-features__description">DESCRIPTION</div>
					</header>
                </div> */ }
				<div style={ { display: 'flex', justifyContent: 'center', marginBottom: '10px' } }>
					<PlanCard>
						{ {
							header: <PlanCardHeader>{ <h1>This is the header.</h1> }</PlanCardHeader>,
							body: <PlanCardBody>{ <p>This is the body.</p> }</PlanCardBody>,
						} }
					</PlanCard>
				</div>
				<PlanGrid />
			</>
		);
	}
}

export default connect( state => {
	return {
		getSiteConnectionStatus: () => getSiteConnectionStatus( state ),
	};
} )( Plans );
