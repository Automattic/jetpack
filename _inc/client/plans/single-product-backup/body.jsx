/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { translate as __ } from 'i18n-calypso';
import { withRouter } from 'react-router';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import { BACKUP_DESCRIPTION } from '../constants';
import PlanRadioButton from '../single-product-components/plan-radio-button';
import ProductSavings from '../single-product-components/product-savings';
import UpgradeButton from '../single-product-components/upgrade-button';
import PromoNudge from '../single-product-components/promo-nudge';
import ExternalLink from 'components/external-link';

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

	handleLandingPageLinkClick = () => {
		const { selectedBackupType, billingTimeFrame } = this.props;
		let type = selectedBackupType;
		if ( 'monthly' === billingTimeFrame ) {
			type += '-monthly';
		}

		analytics.tracks.recordJetpackClick( {
			target: 'landing-page-link',
			feature: 'single-product-backup',
			extra: type,
		} );
	};

	render() {
		const {
			backupOptions,
			billingTimeFrame,
			currencyCode,
			selectedBackupType,
			backupInfoUrl,
		} = this.props;

		const selectedBackup = backupOptions.find( ( { type } ) => type === selectedBackupType );

		return (
			<React.Fragment>
				<p>{ BACKUP_DESCRIPTION }</p>
				<PromoNudge />
				<div className="single-product__landing-page">
					<ExternalLink
						className="single-product__landing-page"
						target="_blank"
						href={ backupInfoUrl }
						icon
						iconSize={ 12 }
						onClick={ this.handleLandingPageLinkClick }
					>
						{ __( 'Which backup option is best for me?' ) }
					</ExternalLink>
				</div>
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
					onClickHandler={ this.handleUpgradeButtonClick }
				/>
			</React.Fragment>
		);
	}
}

export default withRouter( SingleProductBackupBody );
