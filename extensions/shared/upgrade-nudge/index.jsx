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
	<div className="jetpack-upgrade-nudge">
		<Gridicon className="jetpack-upgrade-nudge__icon" icon="star" size={ 18 } />
		<div className="jetpack-upgrade-nudge__info">
			<span className="jetpack-upgrade-nudge__title">
				{ sprintf( __( 'Upgrade to %(planName)s', 'jetpack' ), {
					planName,
				} ) }
			</span>
			<span className="jetpack-upgrade-nudge__message">
				{ __( 'To make this block visible on your site', 'jetpack' ) }
			</span>
		</div>
		<Button
			className="jetpack-upgrade-nudge__button"
			href={ addQueryArgs( `https://wordpress.com/plans/${ getSiteFragment() }`, {
				feature,
				plan,
			} ) }
			isDefault
		>
			{ __( 'Upgrade', 'jetpack' ) }
		</Button>
	</div>
);
export default withSelect( ( select, { plan: planSlug } ) => {
	const plan = select( 'wordpress-com/plans' ).getPlan( planSlug );
	return { planName: get( plan, [ 'product_name_short' ] ) };
} )( UpgradeNudge );
