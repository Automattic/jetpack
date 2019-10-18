/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { AccentedCard, AccentedCardHeader, AccentedCardBody } from './accented-card';
import PlanGrid from './plan-grid';
import QuerySite from 'components/data/query-site';
import { getAvailablePlans } from 'state/site/reducer';

function PlanPriceDisplay() {
	// TODO: actually connect price
	// const { price } = props;

	return (
		<div style={ { height: '50px', lineHeight: '50px', textAlign: 'center' } }>
			<span style={ { display: 'inline-block', verticalAlign: 'middle', lineHeight: 'normal' } }>
				{ '$12-16 /year' }
			</span>
		</div>
	); // TODO: don't use this replace
}

export class Plans extends React.Component {
	state = {
		period: 'yearly',
	};

	renderHeaderContent() {
		const { sitePlans } = this.props;

		return (
			<div
				style={ {
					display: 'flex',
					flexDirection: 'row',
					justifyContent: 'space-between',
					alignContent: 'center',
				} }
			>
				<h3>{ __( 'Jetpack Backup' ) }</h3>
				{ // TODO: make sitePlans dynamic
				sitePlans && (
					<PlanPriceDisplay price={ sitePlans[ 'daily-backup' ].price[ this.state.period ] } />
				) }
			</div>
		);
	}

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
					<AccentedCard>
						{ {
							header: <AccentedCardHeader>{ this.renderHeaderContent() }</AccentedCardHeader>,
							body: (
								<AccentedCardBody>
									{
										<p>
											{ __(
												'Always-on backups ensure you never lose your site. Choose from real-time or daily backups. {{a}}Which one do I need?{{/a}}',
												{ components: { a: <a href="https://jetpack.com/upgrade/backup/" /> } } // TODO: does this link need to open a new tab and have that icon?
											) }
										</p>
									}
								</AccentedCardBody>
							),
						} }
					</AccentedCard>
				</div>
				<PlanGrid />
			</>
		);
	}
}

export default connect( state => {
	const fakedSitePlans = getAvailablePlans( state );
	// TODO: this is faked data; remove before releasing
	if ( fakedSitePlans ) {
		fakedSitePlans[ 'daily-backup' ] = {
			price: {
				yearly: {
					html: '<abbr title="United States Dollars">$</abbr>39',
					text: '$39',
					amount: 39,
					symbol: '$',
					per: '<abbr title="United States Dollars">$</abbr>39 per year',
				},
				monthly: {
					html: '<abbr title="United States Dollars">$</abbr>3.50',
					text: '$3.50',
					amount: 3.5,
					symbol: '$',
					per: '<abbr title="United States Dollars">$</abbr>3.50 per month',
				},
			},
			features: [],
		};
		fakedSitePlans[ 'realtime-backup' ] = {
			price: {
				yearly: {
					html: '<abbr title="United States Dollars">$</abbr>39',
					text: '$39',
					amount: 39,
					symbol: '$',
					per: '<abbr title="United States Dollars">$</abbr>39 per year',
				},
				monthly: {
					html: '<abbr title="United States Dollars">$</abbr>3.50',
					text: '$3.50',
					amount: 3.5,
					symbol: '$',
					per: '<abbr title="United States Dollars">$</abbr>3.50 per month',
				},
			},
			features: [],
		};
	}

	return {
		// sitePlans: getAvailablePlans( state ),
		sitePlans: fakedSitePlans,
	};
} )( Plans );
