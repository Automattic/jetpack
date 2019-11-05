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
import Button from 'components/button';
import QuerySite from 'components/data/query-site';
import Gridicon from 'components/gridicon';
import { getAvailablePlans } from 'state/site/reducer';

function SlashedPrice() {
	return (
		<div className="slashed-price__container" style={ { marginRight: '14px' } }>
			<div className="slashed-price__slash"></div>
			<div className="slashed-price__price">{ '$15-25' }</div>
		</div>
	);
}

function PlanPriceDisplay() {
	// TODO: actually connect price
	// const { price } = props;

	return (
		<div
			style={ {
				display: 'flex',
				flexDirection: 'row',
				justifyContent: 'space-between',
				alignContent: 'center',
			} }
		>
			<SlashedPrice />
			<div className="plans-price__container">
				<span className="plans-price__span">{ '$12-$16 /year' }</span>
			</div>
		</div>
	);
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
				<div style={ { display: 'flex', justifyContent: 'center', marginBottom: '10px' } }>
					<AccentedCard>
						{ {
							header: <AccentedCardHeader>{ this.renderHeaderContent() }</AccentedCardHeader>,
							body: (
								<AccentedCardBody>
									{
										<div className="plans-section__body">
											<p>
												{ __(
													'Always-on backups ensure you never lose your site. Choose from real-time or daily backups. {{a}}Which one do I need?{{ext/}}{{/a}}',
													{
														components: {
															a: <a href="https://jetpack.com/upgrade/backup/" />,
															ext: (
																<>
																	<span>
																		<Gridicon icon="external" size="12" />
																	</span>
																</>
															),
														},
													} // TODO: does this link need to open a new tab and have that icon?
												) }
											</p>
											<h4>Backup options:</h4>
											<div
												style={ {
													display: 'flex',
													flexDirection: 'row',
													justifyContent: 'center',
												} }
											>
												<div className="plans-section__radio-toggle">
													<div
														style={ {
															display: 'flex',
															justifyContent: 'center',
															alignItems: 'center',
														} }
													>
														<input style={ { gridColumn: 1, gridRow: 1 } } type="radio" />
													</div>
													<div style={ { gridColumn: 2, gridRow: 1, fontWeight: 'bold' } }>
														Daily Backups
													</div>
													<div style={ { gridColumn: 2, gridRow: 2 } }>12 - 9 / year</div>
												</div>
												<div className="plans-section__radio-toggle">
													<div
														style={ {
															display: 'flex',
															justifyContent: 'center',
															alignItems: 'center',
														} }
													>
														<input style={ { gridColumn: 1, gridRow: 1 } } type="radio" />
													</div>
													<div style={ { gridColumn: 2, gridRow: 1, fontWeight: 'bold' } }>
														Real-Time Backups
													</div>
													<div style={ { gridColumn: 2, gridRow: 2 } }>12 - 9 / year</div>
												</div>
											</div>
											<div style={ { textAlign: 'center' } }>
												<Button primary>{ __( 'Upgrade to Real-Time Backups' ) }</Button>
											</div>
										</div>
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
