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
import Gridicon from 'components/gridicon';
import { getAvailablePlans } from 'state/site/reducer';

function SlashedPrice() {
	return (
		<div className="slashed-price__container" style={ { marginRight: '14px' } }>
			<div className="slashed-price__slash"></div>
			{ /* TODO: get this from an API or calculate, currently unsure where to get this */ }
			<div className="slashed-price__price">{ '$15-25' }</div>
		</div>
	);
}

function PlanPriceDisplay( props ) {
	const { dailyPrice, yearlyPrice } = props;
	const perYearPriceRange = `${ dailyPrice }-${ yearlyPrice } /year`;

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
				<span className="plans-price__span">{ perYearPriceRange }</span>
			</div>
		</div>
	);
}

export class Plans extends React.Component {
	upgradeLinks = {
		'real-time': 'https://wordpress.com/jetpack/connect/pro',
		daily: 'https://wordpress.com/jetpack/connect/premium',
	};

	upgradeTitles = {
		'real-time': __( 'Upgrade to Real-Time Backups' ),
		daily: 'Upgrade to Daily Backups',
	};

	constructor() {
		super();
		this.state = {
			period: 'yearly',
			selectedBackupType: 'real-time',
		};

		this.handleBackupTypeSelectionChange = this.handleBackupTypeSelectionChange.bind( this );
	}

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
					<PlanPriceDisplay
						dailyPrice={ sitePlans[ 'daily-backup' ].price[ this.state.period ].text }
						yearlyPrice={ sitePlans[ 'realtime-backup' ].price[ this.state.period ].amount }
					/>
				) }
			</div>
		);
	}

	handleBackupTypeSelectionChange( event ) {
		this.setState( { selectedBackupType: event.target.value } );
	}

	render() {
		const { sitePlans } = this.props;
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
														<input
															style={ { gridColumn: 1, gridRow: 1 } }
															type="radio"
															value="daily"
															checked={ 'daily' === this.state.selectedBackupType }
															onChange={ this.handleBackupTypeSelectionChange }
														/>
													</div>
													<div style={ { gridColumn: 2, gridRow: 1, fontWeight: 'bold' } }>
														{ __( 'Daily Backups' ) }
													</div>
													<div style={ { gridColumn: 2, gridRow: 2 } }>
														{ sitePlans &&
															`${ sitePlans[ 'daily-backup' ].price[ this.state.period ].text } /year` }
													</div>
												</div>
												<div className="plans-section__radio-toggle">
													<div
														style={ {
															display: 'flex',
															justifyContent: 'center',
															alignItems: 'center',
														} }
													>
														<input
															style={ { gridColumn: 1, gridRow: 1 } }
															type="radio"
															value="real-time"
															checked={ 'real-time' === this.state.selectedBackupType }
															onChange={ this.handleBackupTypeSelectionChange }
														/>
													</div>
													<div style={ { gridColumn: 2, gridRow: 1, fontWeight: 'bold' } }>
														{ __( 'Real-Time Backups' ) }
													</div>
													<div style={ { gridColumn: 2, gridRow: 2 } }>
														{ sitePlans &&
															`${ sitePlans[ 'realtime-backup' ].price[ this.state.period ].text } /year` }
													</div>
												</div>
											</div>
											<div style={ { textAlign: 'center' } }>
												<a
													href={ this.upgradeLinks[ this.state.selectedBackupType ] }
													type="button"
													class="dops-button is-primary"
												>
													{ this.upgradeTitles[ this.state.selectedBackupType ] }
												</a>
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
					html: '<abbr title="United States Dollars">$</abbr>12',
					text: '$12',
					amount: 12,
					symbol: '$',
					per: '<abbr title="United States Dollars">$</abbr>12 per year',
				},
				// monthly: {
				// 	html: '<abbr title="United States Dollars">$</abbr>3.50',
				// 	text: '$3.50',
				// 	amount: 3.5,
				// 	symbol: '$',
				// 	per: '<abbr title="United States Dollars">$</abbr>3.50 per month',
				// },
			},
			features: [],
		};
		fakedSitePlans[ 'realtime-backup' ] = {
			price: {
				yearly: {
					html: '<abbr title="United States Dollars">$</abbr>16',
					text: '$16',
					amount: 16,
					symbol: '$',
					per: '<abbr title="United States Dollars">$</abbr>16 per year',
				},
				// monthly: {
				// 	html: '<abbr title="United States Dollars">$</abbr>3.50',
				// 	text: '$3.50',
				// 	amount: 3.5,
				// 	symbol: '$',
				// 	per: '<abbr title="United States Dollars">$</abbr>3.50 per month',
				// },
			},
			features: [],
		};
	}

	return {
		// sitePlans: getAvailablePlans( state ),
		sitePlans: fakedSitePlans,
	};
} )( Plans );
