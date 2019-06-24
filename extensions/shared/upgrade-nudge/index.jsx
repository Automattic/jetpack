/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { Button } from '@wordpress/components';
import Gridicon from 'gridicons';

/**
 * Internal dependencies
 */
import getSiteFragment from '../get-site-fragment';

import './style.scss';

export default ( { requiredPlan, feature } ) => (
	<div className="upgrade-nudge">
		<Gridicon className="upgrade-nudge__icon" icon="star" size={ 18 } />
		<div className="upgrade-nudge__info">
			<span className="upgrade-nudge__title">
				{ sprintf( __( 'You need at least the following plan: %(requiredPlan)s', 'jetpack' ), {
					requiredPlan,
				} ) }
			</span>
			<span className="upgrade-nudge__message">{ __( 'To gain access to this block.' ) }</span>
		</div>
		<Button
			className="upgrade-nudge__button"
			href={ addQueryArgs( `//wordpress.com/plans/${ getSiteFragment() }`, { feature } ) }
			isDefault
		>
			{ __( 'Upgrade' ) }
		</Button>
	</div>
);
