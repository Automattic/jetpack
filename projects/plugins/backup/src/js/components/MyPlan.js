/**
 * Internal dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	isJetpackBackup,
	isJetpackBundle,
	isJetpackLegacyPlan,
} from '../../../../jetpack/_inc/client/lib/plans/constants';

// TODO:
// Do JP Legacy plans include backups?
/* eslint react/react-in-jsx-scope: 0 */
const MyPlan = props => {
	const backupPurchasesList = getBackupPurchasesList( props.purchases );
	return (
		<div className="jpb-my-plan-container">
			<h3>{ __( 'My Plan', 'jetpack-backup' ) }</h3>
			<p>{ __( 'The extra power you added to your Jetpack.', 'jetpack-backup' ) }</p>
			{ props.loaded && props.error && <div> { props.error } </div> }
			{ backupPurchasesList }
			<p>
				<a href={ props.redirectUrl } target="_blank" rel="noreferrer">
					{ __( 'Manage your plan', 'jetpack-backup' ) }
				</a>
			</p>
		</div>
	);
};

/**
 * Look for the backup related purchases and return them formatted on html
 *
 * @param {Array} purchases - array of objects containing the site's purchases
 * @returns {Array} a html list of backup plans and expiry dates
 */
function getBackupPurchasesList( purchases ) {
	const backupPurchasesList = [];
	purchases.forEach( purchase => {
		if (
			isJetpackBackup( purchase.product_slug ) ||
			isJetpackBundle( purchase.product_slug ) ||
			isJetpackLegacyPlan( purchase.product_slug )
		) {
			backupPurchasesList.push(
				<>
					<h4> { purchase.product_name } </h4>
					<p> { purchase.expiry_message } </p>
				</>
			);
		}
	} );
	return backupPurchasesList;
}

export default MyPlan;
