/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { map } from 'lodash';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import Button from 'components/button';
import ButtonGroup from 'components/button-group';
import { setPlanDuration, getPlanDuration } from 'state/plans';

class DurationSwitcher extends React.Component {
	handlePeriodChange( newPeriod ) {
		if ( newPeriod === this.props.planDuration ) {
			return null;
		}

		return () => {
			analytics.tracks.recordJetpackClick( {
				target: 'change-period-' + newPeriod,
				feature: 'plans-grid',
				extra: this.props.type,
			} );
			this.props.setPlanDuration( newPeriod );
		};
	}

	render() {
		const { planDuration } = this.props;
		const periods = {
			monthly: __( 'Monthly', 'jetpack' ),
			yearly: __( 'Yearly', 'jetpack' ),
		};

		return (
			<div className="plan-grid-period">
				<ButtonGroup>
					{ map( periods, ( periodLabel, periodName ) => (
						<Button
							key={ 'plan-period-button-' + periodName }
							primary={ periodName === planDuration }
							onClick={ this.handlePeriodChange( periodName ) }
							compact
						>
							{ periodLabel }
						</Button>
					) ) }
				</ButtonGroup>
			</div>
		);
	}
}

export default connect(
	state => {
		return {
			planDuration: getPlanDuration( state ),
		};
	},
	{ setPlanDuration }
)( DurationSwitcher );
