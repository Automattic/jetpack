/**
 * External dependencies
 */
import React, { useState } from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { AccentedCard } from './accented-card';
import Button from 'components/button';
import Gridicon from 'components/gridicon';

export function SingleProductBackup( props ) {
	const { sitePlans, siteRawUrl } = props;

	const [ selectedBackupType, setSelectedBackupType ] = useState( 'real-time' );

	return (
		<>
			<h1 className="plans-section__header">{ __( 'Single Products' ) }</h1>
			<h2 className="plans-section__subheader">
				{ __( "Just looking for backups? We've got you covered." ) }
			</h2>
			<div style={ { display: 'flex', justifyContent: 'center', marginBottom: '10px' } }>
				<AccentedCard>
					{ {
						header: <SingleProductBackupHeader sitePlans={ sitePlans } />,
						body: (
							<SingleProductBackupBody
								selectedBackupType={ selectedBackupType }
								setSelectedBackupType={ setSelectedBackupType }
								sitePlans={ sitePlans }
								siteRawUrl={ siteRawUrl }
							/>
						),
					} }
				</AccentedCard>
			</div>
		</>
	);
}

function SingleProductBackupHeader( props ) {
	const { sitePlans } = props;

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
					monthlyPrice={ sitePlans[ 'daily-backup' ].price.yearly.text }
					yearlyPrice={ sitePlans[ 'realtime-backup' ].price.yearly.amount }
				/>
			) }
		</div>
	);
}

export function PlanPriceDisplay( props ) {
	const { monthlyPrice, yearlyPrice } = props;
	const perYearPriceRange = `${ monthlyPrice }-${ yearlyPrice } /year`;

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

function SlashedPrice() {
	return (
		<div className="slashed-price__container" style={ { marginRight: '14px' } }>
			<div className="slashed-price__slash"></div>
			{ /* TODO: get this from an API or calculate, currently unsure how to get this increased price */ }
			<div className="slashed-price__price">{ '$15-25' }</div>
		</div>
	);
}

function SingleProductBackupBody( props ) {
	const { selectedBackupType, setSelectedBackupType, sitePlans, siteRawUrl } = props;

	const upgradeLinks = {
		'real-time': `https://wordpress.com/checkout/${ siteRawUrl }/professional`,
		daily: `https://wordpress.com/checkout/${ siteRawUrl }/premium`,
	};

	const upgradeTitles = {
		'real-time': __( 'Upgrade to Real-Time Backups' ),
		daily: __( 'Upgrade to Daily Backups' ),
	};

	function handleSelectedBackupTypeChange( event ) {
		setSelectedBackupType( event.target.value );
	}

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

			<h4>{ __( 'Backup options:' ) }</h4>
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
					planPrice={ sitePlans && sitePlans[ 'daily-backup' ].price.yearly.text }
					checked={ 'daily' === selectedBackupType }
					onChange={ handleSelectedBackupTypeChange }
				/>
				<PlanRadioButton
					planName={ __( 'Real-Time Backups' ) }
					radioValue={ 'real-time' }
					planPrice={ sitePlans && sitePlans[ 'realtime-backup' ].price.yearly.text }
					checked={ 'real-time' === selectedBackupType }
					onChange={ handleSelectedBackupTypeChange }
				/>
			</div>

			<div style={ { textAlign: 'center', marginTop: '23px', marginBottom: '10px' } }>
				<Button href={ upgradeLinks[ selectedBackupType ] } primary>
					{ upgradeTitles[ selectedBackupType ] }
				</Button>
			</div>
		</div>
	);
}

export function PlanRadioButton( props ) {
	const { checked, onChange, planName, radioValue, planPrice } = props;

	return (
		<div className="plan-radio-button__container">
			<div style={ { gridColumn: 1, gridRow: 1 } }>
				<input
					type="radio"
					style={ { marginRight: '10px' } }
					value={ radioValue }
					checked={ checked }
					onChange={ onChange }
				/>
			</div>
			<div style={ { gridColumn: 2, gridRow: 1, fontWeight: 'bold' } }>{ planName }</div>
			<div style={ { gridColumn: 2, gridRow: 2 } }>
				{ /* TODO: how to I18N this? */ }
				{ planPrice && `${ planPrice } /year` }
			</div>
		</div>
	);
}
