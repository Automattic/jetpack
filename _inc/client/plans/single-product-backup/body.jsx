/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import { BACKUP_DESCRIPTION } from '../constants';
import ExternalLink from 'components/external-link';
import { getUpgradeUrl } from 'state/initial-state';
import PlanRadioButton from '../single-product-components/plan-radio-button';
import ProductSavings from '../single-product-components/product-savings';
import UpgradeButton from '../single-product-components/upgrade-button';
import PromoNudge from '../single-product-components/promo-nudge';

class SingleProductBackupBody extends React.Component {
	static propTypes = {
		backupOptions: PropTypes.array,
		billingTimeFrame: PropTypes.string,
		currencyCode: PropTypes.string,
		setSelectedBackupType: PropTypes.func,
		selectedBackupType: PropTypes.string,
	};

	handleSelectedBackupTypeChange = event => {
		this.props.setSelectedBackupType( event.target.value );
	};

	handleUpgradeButtonClick = selectedBackupType => () => {
		analytics.tracks.recordJetpackClick( {
			target: `upgrade-${ selectedBackupType }`,
			type: 'upgrade',
			product: selectedBackupType,
			page: this.props.routes[ 0 ] && this.props.routes[ 0 ].name,
		} );
	};

	handleLandingPageLinkClick = selectedBackupType => () => {
		analytics.tracks.recordJetpackClick( {
			target: 'landing-page-link',
			feature: 'single-product-backup',
			extra: selectedBackupType,
		} );
	};

	render() {
		const {
			backupInfoUrl,
			backupOptions,
			billingTimeFrame,
			currencyCode,
			selectedBackupType,
		} = this.props;

		const selectedBackup = backupOptions.find( ( { type } ) => type === selectedBackupType );

		return (
			<React.Fragment>
				<p>
					{ BACKUP_DESCRIPTION } <br />
					<ExternalLink
						target="_blank"
						href={ backupInfoUrl }
						icon
						iconSize={ 12 }
						onClick={ this.handleLandingPageLinkClick }
					>
						{ __( 'Which backup option is best for me?' ) }
					</ExternalLink>
				</p>
				<PromoNudge />
				<h4 className="single-product-backup__options-header">
					{ __( 'Select a backup option:' ) }
				</h4>
				<div className="single-product-backup__radio-buttons-container">
					{ backupOptions.map( option => (
						<PlanRadioButton
							key={ option.type }
							billingTimeFrame={ billingTimeFrame }
							checked={ option.type === selectedBackupType }
							currencyCode={ currencyCode }
							fullPrice={ option.fullPrice }
							discountedPrice={ option.discountedPrice }
							onChange={ this.handleSelectedBackupTypeChange }
							radioValue={ option.type }
							planName={ option.name }
						/>
					) ) }
				</div>
				<ProductSavings
					billingTimeFrame={ billingTimeFrame }
					currencyCode={ currencyCode }
					potentialSavings={ selectedBackup.potentialSavings }
				/>
				<UpgradeButton
					selectedUpgrade={ selectedBackup }
					billingTimeFrame={ billingTimeFrame }
					currencyCode={ currencyCode }
					onClickHandler={ this.handleUpgradeButtonClick }
				/>
			</React.Fragment>
		);
	}
}

export default connect( state => {
	return {
		backupInfoUrl: getUpgradeUrl( state, 'aag-backups' ), // Redirect to https://jetpack.com/upgrade/backup/
	};
} )( SingleProductBackupBody );
