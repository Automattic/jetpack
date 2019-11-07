/**
 * External dependencies
 */
import React, { useState } from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { AccentedCard } from './accented-card';
import { PlanPriceDisplay, PlanRadioButton } from './components';
import Gridicon from 'components/gridicon';

export function SingleProductBackup( props ) {
	const { sitePlans } = props;

	const [ selectedBackupType, setSelectedBackupType ] = useState( 'real-time' );

	return (
		<>
			<h1 className="plans-section__header">Single Products</h1>
			<h2 className="plans-section__subheader">Just looking for backups? We've got you covered.</h2>
			<div style={ { display: 'flex', justifyContent: 'center', marginBottom: '10px' } }>
				<AccentedCard>
					{ {
						header: <SingleProductBackupHeader sitePlans={ sitePlans } />,
						body: (
							<SingleProductBackupBody
								selectedBackupType={ selectedBackupType }
								setSelectedBackupType={ setSelectedBackupType }
								sitePlans={ sitePlans }
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
					dailyPrice={ sitePlans[ 'daily-backup' ].price.yearly.text }
					yearlyPrice={ sitePlans[ 'realtime-backup' ].price.yearly.amount }
				/>
			) }
		</div>
	);
}

function SingleProductBackupBody( props ) {
	const { selectedBackupType, setSelectedBackupType, sitePlans } = props;

	const upgradeLinks = {
		'real-time': 'https://wordpress.com/jetpack/connect/pro',
		daily: 'https://wordpress.com/jetpack/connect/premium',
	};

	const upgradeTitles = {
		'real-time': __( 'Upgrade to Real-Time Backups' ),
		daily: 'Upgrade to Daily Backups',
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
				<a href={ upgradeLinks[ selectedBackupType ] } type="button" class="dops-button is-primary">
					{ upgradeTitles[ selectedBackupType ] }
				</a>
			</div>
		</div>
	);
}
