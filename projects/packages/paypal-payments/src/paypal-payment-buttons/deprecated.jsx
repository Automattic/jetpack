/**
 * PayPal Payment Buttons — Block Deprecations.
 *
 * Defines previous versions of the block's save markup so that WordPress
 * can recognize and gracefully handle blocks created with older versions.
 * Without these entries, editing a post with a legacy block would show
 * "This block contains unexpected or invalid content."
 *
 * @package
 * @since 0.8.0
 */

import { useBlockProps } from '@wordpress/block-editor';

/**
 * v0.4.0-alpha — Original paste-code block.
 *
 * The initial release stored `scriptSrc` and `hostedButtonId` and rendered
 * a simple div container. PayPal's hosted button script would hydrate
 * the div on the frontend.
 *
 * Markup produced:
 * @example
 * <div class="wp-block-jetpack-paypal-payment-buttons">
 * <div class="jetpack-paypal-button jetpack-paypal-button--stacked"
 * id="HOSTED_BUTTON_ID"></div>
 * </div>
 */
const v040Alpha = {
	attributes: {
		buttonType: {
			type: 'string',
			enum: [ 'stacked', 'single' ],
			default: 'stacked',
		},
		scriptSrc: {
			type: 'string',
		},
		hostedButtonId: {
			type: 'string',
		},
		buttonText: {
			type: 'string',
			default: 'Pay Now',
		},
	},

	/**
	 * Determine if a block's attributes match this deprecated version.
	 *
	 * @param {object} attributes - Block attributes.
	 * @return {boolean} True if this is a v0.4.0-alpha block.
	 */
	isEligible( attributes ) {
		// Legacy block: has scriptSrc/hostedButtonId but no isApiManaged flag.
		return Boolean(
			! attributes.isApiManaged && ( attributes.scriptSrc || attributes.hostedButtonId )
		);
	},

	/**
	 * Migrate old attributes to the new schema.
	 *
	 * Adds `isApiManaged: false` so the new save function takes the
	 * correct legacy rendering path. All other attributes pass through.
	 *
	 * @param {object} attributes - Old block attributes.
	 * @return {object} Migrated attributes.
	 */
	migrate( attributes ) {
		return {
			...attributes,
			isApiManaged: false,
		};
	},

	/**
	 * Save function matching the v0.4.0-alpha output.
	 *
	 * Must reproduce the exact HTML that was stored in the database
	 * so WordPress block validation can match and migrate.
	 *
	 * @param {object} props            - Block props.
	 * @param {object} props.attributes - Block attributes.
	 * @return {Element} Saved block markup.
	 */
	save( { attributes } ) {
		const { buttonType, hostedButtonId } = attributes;
		const blockProps = useBlockProps.save();

		if ( ! hostedButtonId ) {
			return <div { ...blockProps } />;
		}

		return (
			<div { ...blockProps }>
				<div
					className={ `jetpack-paypal-button jetpack-paypal-button--${ buttonType }` }
					id={ hostedButtonId }
				/>
			</div>
		);
	},
};

/**
 * Exported deprecations array (newest first).
 *
 * WordPress tries each entry in order until it finds one whose save
 * output matches the stored HTML. Order matters — put the most recent
 * deprecated version first.
 */
const deprecated = [ v040Alpha ];

export default deprecated;
