/**
 * External dependencies
 */
import React, { Fragment } from 'react';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import { translate as __ } from 'i18n-calypso';
import QueryProducts from 'components/data/query-products';
import QuerySite from 'components/data/query-site';
import PlanGrid from './plan-grid';
import ProductSelector from './product-selector';
import PlanSwitcher from './plan-switcher';

export class Plans extends React.Component {
	state = {
		period: 'yearly',
	};

	periods = {
		monthly: __( 'Monthly Billing' ),
		yearly: __( 'Yearly Billing' ),
	};

	constructor( ...args ) {
		super( ...args );
		this.handlePeriodChange = this.handlePeriodChange.bind( this );
	}

	handlePeriodChange( newPeriod ) {
		if ( newPeriod === this.state.period || ! ( newPeriod in this.periods ) ) {
			return null;
		}

		return () => {
			analytics.tracks.recordJetpackClick( {
				target: 'change-period-' + newPeriod,
				feature: 'plans-grid',
			} );

			this.setState( {
				period: newPeriod,
			} );
		};
	}

	render() {
		const { period } = this.state;
		return (
			<Fragment>
				<QueryProducts />
				<QuerySite />
				<PlanSwitcher
					period={ period }
					periods={ this.periods }
					setPeriod={ this.handlePeriodChange }
				/>
				<ProductSelector period={ period } />
				<PlanGrid period={ period } />
			</Fragment>
		);
	}
}

export default Plans;
