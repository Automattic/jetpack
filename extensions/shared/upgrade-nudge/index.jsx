/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import Gridicon from 'gridicons';

import './style.scss';

export default ( { requiredPlan } ) => (
	<div className="upgrade-nudge" href="/plans?customerType=business">
		<Gridicon className="upgrade-nudge__icon" icon="star" size={ 18 } />
		<div className="upgrade-nudge__info">
			<span className="upgrade-nudge__title">
				{ sprintf( __( 'You need at least the following plan: %(requiredPlan)s', 'jetpack' ), {
					requiredPlan,
				} ) }
			</span>
			<span className="upgrade-nudge__message">{ __( 'To gain access to this block.' ) }</span>
		</div>
		<Button className="upgrade-nudge__button">{ __( 'Upgrade' ) }</Button>
	</div>
);
