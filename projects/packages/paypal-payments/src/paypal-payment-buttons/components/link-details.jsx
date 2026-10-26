/**
 * PayPal Payment Buttons — The link details view, the sidebar's default for a saved link.
 *
 * @package
 */

import { formatNumber } from '@automattic/number-formatters';
import { DropdownMenu } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { moreVertical, pencil, trash, update } from '@wordpress/icons';
import { linkDate } from '../utils/link-date';
import { linkPrice } from '../utils/link-price';

/**
 * What the sidebar shows for a saved link: its name and price, then when it
 * was made, its id and where it is used. Edit, Change item and Delete are in
 * the menu beside the name.
 *
 * @param {object}       props               - Component props.
 * @param {object}       props.attributes    - Block attributes.
 * @param {object|null}  props.resource      - The payment as last read from PayPal, null until then.
 * @param {Element|null} props.notices       - Notices about the link itself, shown above the view.
 * @param {Function}     props.onEdit        - Open the form.
 * @param {Function}     props.onChangeLink  - Open the picker of the account's other links.
 * @param {boolean}      props.canChangeLink - Whether there is another link to switch to, or the
 *                                           list is still being read.
 * @param {Function}     props.onDelete      - Open the delete dialog.
 * @param {boolean}      props.canDelete     - Whether Delete can run: connected and not busy.
 * @return {Element} The view.
 */
export default function LinkDetails( {
	attributes,
	resource,
	notices,
	onEdit,
	onChangeLink,
	canChangeLink,
	onDelete,
	canDelete,
} ) {
	const { productName, resourceId, adjustableQuantity, maxQuantity } = attributes;
	const price = linkPrice( attributes );
	// Shown until the payment has been read back, or when it could not be.
	const unknown = '—';

	let usedOn = unknown;
	if ( typeof resource?.embeds === 'number' ) {
		usedOn = sprintf(
			/* translators: %s: formatted number of published posts embedding the payment button */
			_n( '%s published post', '%s published posts', resource.embeds, 'jetpack-paypal-payments' ),
			formatNumber( resource.embeds )
		);
	}

	const rows = [
		[ __( 'Created', 'jetpack-paypal-payments' ), linkDate( resource ) || unknown ],
		// PayPal's hosted button id is the resource id without its PLB- prefix, as in the
		// payment link's path. Plain text like its siblings: wp-admin gives every `code`
		// a grey monospace box.
		[ __( 'Hosted ID', 'jetpack-paypal-payments' ), ( resourceId || '' ).replace( /^PLB-/, '' ) ],
		[ __( 'Used on', 'jetpack-paypal-payments' ), usedOn ],
	];
	if ( adjustableQuantity ) {
		rows.push( [ __( 'Max quantity', 'jetpack-paypal-payments' ), maxQuantity ] );
	}

	return (
		<div className="jetpack-paypal-payment-buttons__details">
			{ notices }
			<div className="jetpack-paypal-payment-buttons__details-header">
				<h2 className="jetpack-paypal-payment-buttons__details-title">
					{ productName || resourceId }
				</h2>
				<DropdownMenu
					icon={ moreVertical }
					label={ __( 'Payment button options', 'jetpack-paypal-payments' ) }
					toggleProps={ { size: 'small' } }
					controls={ [
						{
							title: __( 'Edit', 'jetpack-paypal-payments' ),
							icon: pencil,
							onClick: onEdit,
						},
						{
							title: __( 'Change item', 'jetpack-paypal-payments' ),
							icon: update,
							onClick: onChangeLink,
							isDisabled: ! canChangeLink,
						},
						{
							title: __( 'Delete', 'jetpack-paypal-payments' ),
							icon: trash,
							onClick: onDelete,
							isDisabled: ! canDelete,
						},
					] }
				/>
			</div>
			{ price && <p className="jetpack-paypal-payment-buttons__details-price">{ price }</p> }
			<dl className="jetpack-paypal-payment-buttons__details-list">
				{ rows.map( ( [ label, value ] ) => (
					<Fragment key={ label }>
						<dt>{ label }</dt>
						<dd>{ value }</dd>
					</Fragment>
				) ) }
			</dl>
		</div>
	);
}
