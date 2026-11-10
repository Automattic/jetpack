/**
 * PayPal Payment Buttons — A saved link's name and price, and its details rows.
 *
 * @package
 */

import { DropdownMenu, PanelBody } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { moreVertical, pencil, trash, update } from '@wordpress/icons';
import { linkDate } from '../utils/link-date';
import { linkPrice } from '../utils/link-price';

/**
 * A saved link's name and price, shown above the style controls. Edit, Change
 * item and Delete are in the menu beside the name.
 *
 * @param {object}       props               - Component props.
 * @param {object}       props.attributes    - Block attributes.
 * @param {Element|null} props.notices       - Notices about the link itself, shown above the name.
 * @param {Function}     props.onEdit        - Open the form.
 * @param {Function}     props.onChangeLink  - Open the picker of the account's other links.
 * @param {boolean}      props.canChangeLink - Whether there is another link to switch to, or the
 *                                           list is still being read.
 * @param {Function}     props.onDelete      - Open the delete dialog.
 * @param {boolean}      props.canDelete     - Whether Delete can run: connected and not busy.
 * @return {Element} The name and price.
 */
export default function LinkDetails( {
	attributes,
	notices,
	onEdit,
	onChangeLink,
	canChangeLink,
	onDelete,
	canDelete,
} ) {
	const { productName, resourceId } = attributes;
	const price = linkPrice( attributes );

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
		</div>
	);
}

/**
 * When the link was made, its id, where it is used and, when buyers can pick a
 * quantity, the maximum. Shown below the style controls.
 *
 * @param {object}      props            - Component props.
 * @param {object}      props.attributes - Block attributes.
 * @param {object|null} props.resource   - The payment as last read from PayPal, null until then.
 * @return {Element} The list.
 */
export function LinkDetailsList( { attributes, resource } ) {
	const { resourceId, adjustableQuantity, maxQuantity } = attributes;
	// Shown until the payment has been read back, or when it could not be.
	const unknown = '—';

	let usedOn = unknown;
	if ( typeof resource?.embeds === 'number' ) {
		usedOn = sprintf(
			/* translators: %d: number of published posts embedding the payment button */
			_n( '%d published post', '%d published posts', resource.embeds, 'jetpack-paypal-payments' ),
			resource.embeds
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

	// A title-less panel, so core draws the divider above it as it does between panels.
	return (
		<PanelBody>
			<dl className="jetpack-paypal-payment-buttons__details-list">
				{ rows.map( ( [ label, value ] ) => (
					<Fragment key={ label }>
						<dt>{ label }</dt>
						<dd>{ value }</dd>
					</Fragment>
				) ) }
			</dl>
		</PanelBody>
	);
}
