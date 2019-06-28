/**
 * External dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { Button } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import Gridicon from 'gridicons';

/**
 * Internal dependencies
 */
import getSiteFragment from '../get-site-fragment';
import './store';

import './style.scss';

const UpgradeNudge = ( { feature, plan } ) => (
	<div className="upgrade-nudge">
		<Gridicon className="upgrade-nudge__icon" icon="star" size={ 18 } />
		<div className="upgrade-nudge__info">
			<span className="upgrade-nudge__title">
				{ sprintf( __( 'You need at least the following plan: %(plan)s', 'jetpack' ), { plan } ) }
			</span>
			<span className="upgrade-nudge__message">{ __( 'To gain access to this block.' ) }</span>
		</div>
		<Button
			className="upgrade-nudge__button"
			href={ addQueryArgs( `https://wordpress.com/plans/${ getSiteFragment() }`, {
				feature,
				plan,
			} ) }
			isDefault
		>
			{ __( 'Upgrade' ) }
		</Button>
	</div>
);
export default withSelect( ( select, { plan } ) => {
	const plans = select( 'wordpress-com/plans' ).getPlan();
	console.log( plan, plans );
	return { plans };
} )( UpgradeNudge );
