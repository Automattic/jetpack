/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import SimpleNotice from 'components/notice';
import { getActiveSitePurchases } from 'state/site';

class PlanConflictWarning extends React.Component {
	render() {
		const { activeSitePurchases } = this.props;

		if ( activeSitePurchases.length <= 1 ) {
			return false;
		}

		const featureName = 'real-time backups';
		const planName = 'Jetpack Professional';
		const productName = 'Jetpack Backup (Real-time)';

		return (
			<SimpleNotice
				status="is-warning"
				showDismiss={ false }
				text={ __(
					'Your %(planName)s Plan includes %(featureName)s. ' +
						'Looks like you also purchased the %(productName)s product. ' +
						'Consider removing %(productName)s.',
					{
						args: {
							featureName,
							planName,
							productName,
						},
					}
				) }
			/>
		);
	}
}

export default connect( state => ( {
	activeSitePurchases: getActiveSitePurchases( state ),
} ) )( PlanConflictWarning );
