/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { AccentedCard } from './accented-card';
import { PlanPriceDisplay, PlanRadioButton } from './components';
import PlanGrid from './plan-grid';
import QuerySite from 'components/data/query-site';
import Gridicon from 'components/gridicon';
import { getAvailablePlans } from 'state/site/reducer';

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
				{ sitePlans && (
					<PlanPriceDisplay
						dailyPrice={ sitePlans[ 'daily-backup' ].price[ this.state.period ].text }
						yearlyPrice={ sitePlans[ 'realtime-backup' ].price[ this.state.period ].amount }
					/>
				) }
			</div>
		);
	}

	renderBodyContent() {
		const { sitePlans } = this.props;

		return (
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
						} // TODO: make icon color change with link
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
					<PlanRadioButton
						planName={ __( 'Daily Backups' ) }
						radioValue={ 'daily' }
						planPrice={ sitePlans && sitePlans[ 'daily-backup' ].price[ this.state.period ].text }
						checked={ 'daily' === this.state.selectedBackupType }
						onChange={ this.handleBackupTypeSelectionChange }
					/>
					<PlanRadioButton
						planName={ __( 'Real-Time Backups' ) }
						radioValue={ 'real-time' }
						planPrice={
							sitePlans && sitePlans[ 'realtime-backup' ].price[ this.state.period ].text
						}
						checked={ 'real-time' === this.state.selectedBackupType }
						onChange={ this.handleBackupTypeSelectionChange }
					/>
				</div>
				<div style={ { textAlign: 'center', marginTop: '23px', marginBottom: '10px' } }>
					<a
						href={ this.upgradeLinks[ this.state.selectedBackupType ] }
						type="button"
						class="dops-button is-primary"
					>
						{ this.upgradeTitles[ this.state.selectedBackupType ] }
					</a>
				</div>
			</div>
		);
	}

	handleBackupTypeSelectionChange( event ) {
		this.setState( { selectedBackupType: event.target.value } );
	}

	render() {
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
							header: this.renderHeaderContent(),
							body: this.renderBodyContent(),
						} }
					</AccentedCard>
				</div>
				<PlanGrid />
			</>
		);
	}
}

export default connect( state => {
	return {
		// TODO: remove faked data before releasing
		sitePlans: addFakedSitePlans( getAvailablePlans( state ) ),
	};
} )( Plans );

function addFakedSitePlans( sitePlans ) {
	if ( sitePlans ) {
		sitePlans[ 'daily-backup' ] = {
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
		sitePlans[ 'realtime-backup' ] = {
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
	return sitePlans;
}
