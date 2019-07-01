/**
 * External dependencies
 */
import { get } from 'lodash';
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

const UpgradeNudge = ( { feature, plan, planName } ) => (
	<div className="upgrade-nudge">
		<Gridicon className="upgrade-nudge__icon" icon="star" size={ 18 } />
		<div className="upgrade-nudge__info">
			<span className="upgrade-nudge__title">
				{ sprintf( __( 'Upgrade to %(planName)s', 'jetpack' ), {
					planName,
				} ) }
			</span>
			<span className="upgrade-nudge__message">
				{ __( 'To make this block visible on your site' ) }
			</span>
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
export default withSelect( ( select, { plan: planSlug } ) => {
	const plan = select( 'wordpress-com/plans' ).getPlan( planSlug );
	return { planName: get( plan, [ 'product_name_short' ] ) };
} )( UpgradeNudge );
