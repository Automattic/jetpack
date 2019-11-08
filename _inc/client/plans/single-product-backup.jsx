/**
 * External dependencies
 */
import React, { useState } from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import ExternalLink from 'components/external-link';

import './single-product-backup.scss';

export function SingleProductBackup( props ) {
	const { sitePlans, siteRawUrl } = props;

	const [ selectedBackupType, setSelectedBackupType ] = useState( 'real-time' );

	return (
		<React.Fragment>
			<h1 className="plans-section__header">{ __( 'Single Products' ) }</h1>
			<h2 className="plans-section__subheader">
				{ __( "Just looking for backups? We've got you covered." ) }
			</h2>
			<div className="single-product-backup__accented-card-container">
				<div className="single-product-backup__accented-card">
					<div className={ 'single-product-backup__accented-card__header' }>
						<SingleProductBackupHeader sitePlans={ sitePlans } />
					</div>
					<div className={ 'single-product-backup__accented-card__body' }>
						<SingleProductBackupBody
							selectedBackupType={ selectedBackupType }
							setSelectedBackupType={ setSelectedBackupType }
							sitePlans={ sitePlans }
							siteRawUrl={ siteRawUrl }
						/>
					</div>
				</div>
			</div>
		</React.Fragment>
	);
}

function SingleProductBackupHeader( props ) {
	const { sitePlans } = props;

	return (
		<div className="single-product-backup__header-container">
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
		<div className="single-product-backup__plan-price-display-container">
			<div className="slashed-price__container">
				<div className="slashed-price__slash"></div>
				{ /* TODO: get this from an API or calculate, currently unsure how to get this increased price */ }
				<div className="slashed-price__price">{ '$15-25' }</div>
			</div>
			<div className="plans-price__container">
				<span className="plans-price__span">{ perYearPriceRange }</span>
			</div>
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
					'Always-on backups ensure you never lose your site. Choose from real-time or daily backups. {{ExternalLink}}Which one do I need?{{/ExternalLink}}',
					{
						components: {
							ExternalLink: (
								<ExternalLink href="https://jetpack.com/upgrade/backup/" icon iconSize={ 12 } />
							),
						},
					}
				) }
			</p>

			<h4>{ __( 'Backup options:' ) }</h4>
			{ sitePlans && (
				<div className="single-product-backup__radio-buttons-container">
					<PlanRadioButton
						planName={ __( 'Daily Backups' ) }
						radioValue={ 'daily' }
						planPrice={ sitePlans[ 'daily-backup' ].price.yearly.text }
						checked={ 'daily' === selectedBackupType }
						onChange={ handleSelectedBackupTypeChange }
					/>
					<PlanRadioButton
						planName={ __( 'Real-Time Backups' ) }
						radioValue={ 'real-time' }
						planPrice={ sitePlans[ 'realtime-backup' ].price.yearly.text }
						checked={ 'real-time' === selectedBackupType }
						onChange={ handleSelectedBackupTypeChange }
					/>
				</div>
			) }

			<div className="single-product-backup__upgrade-button-container">
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
			<div className="plan-radio-button__radio-input-wrapper">
				<input
					type="radio"
					className="plan-radio-button__input"
					value={ radioValue }
					checked={ checked }
					onChange={ onChange }
				/>
			</div>
			<div className="plan-radio-button__plan-name">{ planName }</div>
			<div className="plan-radio-button__plan-price">
				{ /* TODO: how to I18N this? */ }
				{ planPrice && `${ planPrice } /year` }
			</div>
		</div>
	);
}
