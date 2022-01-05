/**
 * Internal dependencies
 */
import { useState, useEffect, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import {
	isJetpackBackup,
	isJetpackBundle,
	isJetpackLegacyPlan,
} from '../../../../jetpack/_inc/client/lib/plans/constants';

/* eslint react/react-in-jsx-scope: 0 */
const MyPlan = props => {
	const [ sitePurchases, setSitePurchases ] = useState( [] );
	const [ sitePurchasesError, setSitePurchasesError ] = useState( null );
	const [ sitePurchasesLoaded, setSitePurchasesLoaded ] = useState( false );

	// API call to get all site purchases
	useEffect( () => {
		apiFetch( { path: '/jetpack/v4/site/current-purchases' } ).then(
			res => {
				setSitePurchases( JSON.parse( res.data ) );
				setSitePurchasesLoaded( true );
			},
			() => {
				setSitePurchasesLoaded( true );
				setSitePurchasesError( __( 'Failed to fetch site purchases', 'jetpack-backup' ) );
			}
		);
	}, [] );

	const purchasesList = getPurchasesList( sitePurchases, props.purchaseType );
	return (
		<div className="jpb-my-plan-container">
			<h3>{ __( 'My Plan', 'jetpack-backup' ) }</h3>
			<p>{ __( 'The extra power you added to your Jetpack.', 'jetpack-backup' ) }</p>
			{ sitePurchasesLoaded && sitePurchasesError && <div> { sitePurchasesError } </div> }
			{ purchasesList }
			<p>
				<a href={ props.redirectUrl } target="_blank" rel="noreferrer">
					{ __( 'Manage your plan', 'jetpack-backup' ) }
				</a>
			</p>
		</div>
	);
};

/**
 * Look for the types related purchases and return them formatted on html
 *
 * @param {Array} purchases - array of objects containing the site's purchases
 * @param {string} purchaseType - the type of plans to filter and display
 * @returns {Array} a html list of the specified type plans and expiry dates
 */
function getPurchasesList( purchases, purchaseType ) {
	let filteredPurchases = [];
	const purchasesList = [];

	if ( purchaseType === 'backup' ) {
		purchases.forEach( purchase => {
			if (
				isJetpackBackup( purchase.product_slug ) ||
				isJetpackBundle( purchase.product_slug ) ||
				isJetpackLegacyPlan( purchase.product_slug )
			) {
				filteredPurchases.push( purchase );
			}
		} );
	} else {
		filteredPurchases = purchases;
	}

	filteredPurchases.forEach( purchase => {
		purchasesList.push(
			<Fragment>
				<h4> { purchase.product_name } </h4>
				<p> { purchase.expiry_message } </p>
			</Fragment>
		);
	} );

	return purchasesList;
}

MyPlan.defaultProps = {
	purchaseType: 'all',
};

export default MyPlan;
