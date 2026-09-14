/* eslint-disable react/jsx-no-bind */
/**
 * Product Variants Builder.
 *
 * Reusable component for building product variant option groups
 * (e.g., Color, Size) with options and optional per-option pricing.
 *
 * @package
 * @since 0.9.0
 */

import { Button, CheckboxControl, TextControl, ToggleControl } from '@wordpress/components';
import { useRef, useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import GridiconTrash from 'gridicons/dist/trash';
import { getPriceStep } from '../utils/currency-symbols';
import { validatePrice } from '../utils/validation';

// Pre-extract translated strings used in ternaries to avoid i18n build errors.
const helpVariants = __(
	'Options for your item, up to 5 variations in color, size, type, etc.',
	'jetpack-paypal-payments'
);
const helpPricingFirstGroup = __(
	'You can only set the price for your first variant.',
	'jetpack-paypal-payments'
);

const MAX_GROUPS = 5;
const MAX_OPTIONS = 10;

let nextId = 1;

/**
 * Generate a stable unique ID for keying React elements.
 *
 * @return {string} A unique ID string.
 */
function uid() {
	return `vb-${ nextId++ }`;
}

/**
 * Create a new empty option group (dimension).
 *
 * Never primary - pricing is off until the merchant turns it on.
 *
 * @return {object} New group object with a stable _key.
 */
function createGroup() {
	return {
		_key: uid(),
		name: '',
		primary: false,
		options: [ { _key: uid(), label: '' } ],
	};
}

/**
 * Create a new empty option.
 *
 * @param {boolean} withPricing - Whether to include pricing fields.
 * @param {string}  currency    - Currency code for pricing.
 * @return {object} New option object with a stable _key.
 */
function createOption( withPricing = false, currency = 'USD' ) {
	const opt = { _key: uid(), label: '' };
	if ( withPricing ) {
		opt.unit_amount = { currency_code: currency, value: '' };
	}
	return opt;
}

/**
 * Drop an option's price, keeping everything else it carries.
 *
 * @param {object} option - The option to strip.
 * @return {object} The option without its amount.
 */
function withoutAmount( option ) {
	const rest = { ...option };
	delete rest.unit_amount;
	return rest;
}

/**
 * Find the primary option group — the one that carries per-option pricing.
 *
 * @param {object} variants - The variants data.
 * @return {object|null} The primary dimension, or null when there isn't one.
 */
export function getPrimaryDimension( variants ) {
	return variants?.dimensions?.find( dim => dim.primary ) || null;
}

/**
 * Which option group carries the prices.
 *
 * @param {Array} dimensions - The option groups.
 * @return {number} Its index, or -1 when pricing is off.
 */
function getPrimaryIndex( dimensions ) {
	return dimensions.findIndex( dim => dim.primary );
}

/**
 * Whether the primary group carries prices.
 *
 * PayPal rejects a request that carries `unit_amount` at both the product level
 * and the variant level, so the request builder drops the product-level price
 * once this is true. The server's sanitiser reads the same thing.
 *
 * @param {boolean} enabled  - Whether variants are enabled.
 * @param {object}  variants - The variants data.
 * @return {boolean} True when at least one primary option has a price.
 */
export function hasVariantPricing( enabled, variants ) {
	if ( ! enabled ) {
		return false;
	}

	const primary = getPrimaryDimension( variants );

	return !! primary?.options?.some( opt => `${ opt.unit_amount?.value ?? '' }`.trim() !== '' );
}

/**
 * Whether per-variant pricing is turned on.
 *
 * The form reads this for which fields to show and whether an empty option price
 * is an error. `hasVariantPricing` above reads the prices actually entered, which
 * is what the request builder and the server sanitiser use.
 *
 * @param {boolean} enabled  - Whether variants are enabled.
 * @param {object}  variants - The variants data.
 * @return {boolean} True when a group is marked primary.
 */
export function isVariantPricingOn( enabled, variants ) {
	return !! enabled && !! getPrimaryDimension( variants );
}

/**
 * The kinds of error validateVariants() reports.
 *
 * Every one has to reach the merchant through a control in GroupEditor. A kind that
 * only reaches the save gate leaves a dead button with nothing on screen saying why,
 * which is how `options` shipped. The block's tests assert this list against what the
 * validator actually emits, so a new kind fails there until it has somewhere to render.
 */
export const VARIANT_ERROR_FIELDS = {
	NAME: 'name',
	OPTIONS: 'options',
	LABEL: 'label',
	PRICE: 'price',
};

/**
 * Validate variant data.
 *
 * Errors carry the group and option they belong to so the builder can render each
 * one under the control that caused it.
 *
 * @param {boolean} enabled      - Whether variants are enabled.
 * @param {object}  variants     - The variants data.
 * @param {string}  currencyCode - Product currency the option prices are in.
 * @return {Array} Errors as { group, option, field, message }. Empty if valid.
 */
export function validateVariants( enabled, variants, currencyCode = 'USD' ) {
	if ( ! enabled || ! variants?.dimensions?.length ) {
		return [];
	}

	const errors = [];

	variants.dimensions.forEach( ( dim, i ) => {
		if ( ! dim.name?.trim() ) {
			errors.push( {
				group: i,
				option: null,
				field: VARIANT_ERROR_FIELDS.NAME,
				message: __( 'Variant name is required.', 'jetpack-paypal-payments' ),
			} );
		}

		// A priced group with nothing in it hides the product price field and prices
		// nothing in its place, which reaches PayPal as a 0.00 product.
		if ( dim.primary && ! dim.options?.length ) {
			errors.push( {
				group: i,
				option: null,
				field: VARIANT_ERROR_FIELDS.OPTIONS,
				message: __( 'Add at least one option to price.', 'jetpack-paypal-payments' ),
			} );
		}

		dim.options?.forEach( ( opt, j ) => {
			if ( ! opt.label?.trim() ) {
				errors.push( {
					group: i,
					option: j,
					field: VARIANT_ERROR_FIELDS.LABEL,
					message: __( 'Option name is required.', 'jetpack-paypal-payments' ),
				} );
			}

			// Primary-group prices replace the product price, so every option needs one.
			if ( ! dim.primary ) {
				return;
			}

			const message = validatePrice( `${ opt.unit_amount?.value ?? '' }`.trim(), currencyCode );
			if ( message ) {
				errors.push( { group: i, option: j, field: VARIANT_ERROR_FIELDS.PRICE, message } );
			}
		} );
	} );

	return errors;
}

/**
 * Single option group editor with its options.
 *
 * @param {object}   props              - Component props.
 * @param {object}   props.group        - The group data.
 * @param {number}   props.index        - Group index.
 * @param {string}   props.currencyCode - Product currency for pricing.
 * @param {Array}    props.errors       - This group's validation errors.
 * @param {object}   props.touched      - Fields the merchant has left, keyed by field key.
 * @param {boolean}  props.showAll      - Show every error, whether or not its field was left.
 * @param {Function} props.onTouch      - Callback with a field key once it is left.
 * @param {Function} props.onChange     - Callback when group changes.
 * @param {Function} props.onRemove     - Callback to remove this group.
 * @param {boolean}  props.disabled     - Whether inputs are disabled.
 * @return {Element} Group editor.
 */
function GroupEditor( {
	group,
	index,
	currencyCode,
	errors,
	touched,
	showAll,
	onTouch,
	onChange,
	onRemove,
	disabled,
} ) {
	const lastOptionRef = useRef( null );
	const [ focusNewOption, setFocusNewOption ] = useState( false );

	// Focus newly added option.
	useEffect( () => {
		if ( focusNewOption && lastOptionRef.current ) {
			lastOptionRef.current.querySelector( 'input' )?.focus();
			setFocusNewOption( false );
		}
	}, [ focusNewOption ] );

	// A field only shows its error once the merchant has left it - enabling the panel
	// seeds an empty group, which is invalid from the first render. Keys ride on the
	// stable _key, so removing a group or an option does not hand its marks to a neighbour.
	// A variants structure read back from PayPal carries no _key, so fall back to the index.
	const groupKey = group._key || `#${ index }`;
	const fieldKey = ( optIndex, field ) =>
		optIndex === null
			? `variant:${ groupKey }:${ field }`
			: `variant:${ groupKey }:${ group.options[ optIndex ]?._key || `#${ optIndex }` }:${ field }`;

	// Turning pricing on is the interaction, so price errors show right away - waiting
	// for a blur would disable Save with no visible error. The tax rate field does the same.
	const errorFor = ( optIndex, field ) => {
		const revealed =
			showAll || field === VARIANT_ERROR_FIELDS.PRICE || touched[ fieldKey( optIndex, field ) ];
		return revealed
			? errors.find( e => e.option === optIndex && e.field === field )?.message
			: undefined;
	};

	const updateName = name => {
		onChange( { ...group, name } );
	};

	const updateOption = ( optIndex, updates ) => {
		const newOptions = [ ...group.options ];
		newOptions[ optIndex ] = { ...newOptions[ optIndex ], ...updates };
		onChange( { ...group, options: newOptions } );
	};

	const addOption = () => {
		if ( group.options.length >= MAX_OPTIONS ) {
			return;
		}
		onChange( {
			...group,
			options: [ ...group.options, createOption( group.primary, currencyCode ) ],
		} );
		setFocusNewOption( true );
	};

	const removeOption = optIndex => {
		const newOptions = group.options.filter( ( _, i ) => i !== optIndex );
		onChange( { ...group, options: newOptions } );
	};

	const groupLabel =
		group.name ||
		sprintf(
			/* translators: %d: variant number */
			__( 'Variant %d', 'jetpack-paypal-payments' ),
			index + 1
		);

	return (
		<div className="jetpack-paypal-variants__group" role="group" aria-label={ groupLabel }>
			<TextControl
				label={ __( 'Variant name', 'jetpack-paypal-payments' ) }
				aria-label={ sprintf(
					/* translators: %d: variant number */
					__( 'Variant name %d', 'jetpack-paypal-payments' ),
					index + 1
				) }
				value={ group.name }
				onChange={ updateName }
				onBlur={ () => onTouch( fieldKey( null, VARIANT_ERROR_FIELDS.NAME ) ) }
				placeholder={ __( 'Enter variant name', 'jetpack-paypal-payments' ) }
				disabled={ disabled }
				help={ errorFor( null, VARIANT_ERROR_FIELDS.NAME ) }
				className={
					errorFor( null, VARIANT_ERROR_FIELDS.NAME )
						? 'jetpack-paypal-payment-buttons__has-error'
						: undefined
				}
			/>
			<Button
				isDestructive
				isSmall
				variant="tertiary"
				icon={ <GridiconTrash size={ 18 } /> }
				onClick={ onRemove }
				disabled={ disabled }
				label={ sprintf(
					/* translators: %s: group name */
					__( 'Remove variant "%s"', 'jetpack-paypal-payments' ),
					groupLabel
				) }
			/>

			<div className="jetpack-paypal-variants__options">
				{ group.options.map( ( option, optIndex ) => (
					<div
						key={ option._key || optIndex }
						className="jetpack-paypal-variants__option"
						ref={ optIndex === group.options.length - 1 ? lastOptionRef : null }
					>
						<TextControl
							label={ sprintf(
								/* translators: %d: option number */
								__( 'Option %d', 'jetpack-paypal-payments' ),
								optIndex + 1
							) }
							value={ option.label }
							onChange={ label => updateOption( optIndex, { label } ) }
							onBlur={ () => onTouch( fieldKey( optIndex, VARIANT_ERROR_FIELDS.LABEL ) ) }
							placeholder={ __( 'Enter option name', 'jetpack-paypal-payments' ) }
							disabled={ disabled }
							help={ errorFor( optIndex, VARIANT_ERROR_FIELDS.LABEL ) }
							className={
								errorFor( optIndex, VARIANT_ERROR_FIELDS.LABEL )
									? 'jetpack-paypal-payment-buttons__has-error'
									: undefined
							}
						/>
						{ group.primary && (
							<TextControl
								label={ __( 'Price', 'jetpack-paypal-payments' ) }
								hideLabelFromVision
								value={ option.unit_amount?.value || '' }
								onChange={ value =>
									updateOption( optIndex, {
										unit_amount: {
											currency_code: currencyCode,
											value,
										},
									} )
								}
								type="number"
								min={ getPriceStep( currencyCode ) }
								step={ getPriceStep( currencyCode ) }
								placeholder={ __( 'Price', 'jetpack-paypal-payments' ) }
								disabled={ disabled }
								help={ errorFor( optIndex, VARIANT_ERROR_FIELDS.PRICE ) }
								className={
									errorFor( optIndex, VARIANT_ERROR_FIELDS.PRICE )
										? 'jetpack-paypal-payment-buttons__has-error'
										: undefined
								}
							/>
						) }
						{ group.options.length > 1 && (
							<Button
								isSmall
								isDestructive
								variant="tertiary"
								icon={ <GridiconTrash size={ 18 } /> }
								onClick={ () => removeOption( optIndex ) }
								disabled={ disabled }
								label={ sprintf(
									/* translators: 1: option number, 2: group name */
									__( 'Remove option %1$d from "%2$s"', 'jetpack-paypal-payments' ),
									optIndex + 1,
									groupLabel
								) }
								className="jetpack-paypal-variants__remove-option"
							/>
						) }
					</div>
				) ) }

				{ /* A priced group with nothing in it blocks Save, and the merchant can only
				     fix it here - so the message belongs beside the button that adds one. */ }
				{ errorFor( null, VARIANT_ERROR_FIELDS.OPTIONS ) && (
					<p className="jetpack-paypal-variants__option-error">
						{ errorFor( null, VARIANT_ERROR_FIELDS.OPTIONS ) }
					</p>
				) }

				<div className="jetpack-paypal-variants__option-actions">
					{ group.options.length < MAX_OPTIONS ? (
						<Button isSmall variant="link" onClick={ addOption } disabled={ disabled }>
							{ __( '+ Add another option', 'jetpack-paypal-payments' ) }
						</Button>
					) : (
						<p className="jetpack-paypal-variants__limit-notice">
							{ sprintf(
								/* translators: %d: maximum number of options */
								__( 'Maximum of %d options reached.', 'jetpack-paypal-payments' ),
								MAX_OPTIONS
							) }
						</p>
					) }
				</div>
			</div>
		</div>
	);
}

/**
 * Product Variants builder.
 *
 * @param {object}   props              - Component props.
 * @param {boolean}  props.enabled      - Whether variants are enabled.
 * @param {object}   props.variants     - The variants data.
 * @param {string}   props.currencyCode - Product currency code.
 * @param {Function} props.onChange     - Callback with { variantsEnabled, variants }.
 * @param {boolean}  props.disabled     - Whether inputs are disabled.
 * @param {Array}    props.errors       - Validation errors from validateVariants().
 * @param {object}   props.touched      - The form's touched fields, keyed by field key.
 * @param {boolean}  props.showAll      - Show every error, whether or not its field was left.
 * @param {Function} props.onTouch      - Callback with a field key once it is left.
 * @return {Element} Variants builder.
 */
export default function VariantBuilder( {
	enabled,
	variants,
	currencyCode = 'USD',
	onChange,
	disabled,
	errors = [],
	touched = {},
	showAll,
	onTouch,
} ) {
	const dimensions = variants?.dimensions || [];
	const primaryIndex = getPrimaryIndex( dimensions );
	const pricingOn = primaryIndex !== -1;
	const lastGroupRef = useRef( null );
	const [ focusNewGroup, setFocusNewGroup ] = useState( false );

	// Focus newly added group.
	useEffect( () => {
		if ( focusNewGroup && lastGroupRef.current ) {
			lastGroupRef.current.querySelector( 'input' )?.focus();
			setFocusNewGroup( false );
		}
	}, [ focusNewGroup ] );

	const setEnabled = newEnabled => {
		if ( newEnabled && dimensions.length === 0 ) {
			onChange( {
				variantsEnabled: true,
				variants: { dimensions: [ createGroup() ] },
			} );
		} else {
			onChange( { variantsEnabled: newEnabled } );
		}
	};

	const updateDimension = ( dimIndex, newDimension ) => {
		const newDimensions = [ ...dimensions ];
		newDimensions[ dimIndex ] = newDimension;
		onChange( {
			variants: { dimensions: newDimensions },
		} );
	};

	const removeDimension = dimIndex => {
		const newDimensions = dimensions.filter( ( _, i ) => i !== dimIndex );
		onChange( {
			variants: { dimensions: newDimensions },
			...( newDimensions.length === 0 ? { variantsEnabled: false } : {} ),
		} );
	};

	// PayPal prices the primary group only, so turning pricing on marks a group primary.
	// New buttons use the first group; one that already prices a later group keeps it,
	// so its prices survive the save.
	const setPricingEnabled = on => {
		const target = primaryIndex === -1 ? 0 : primaryIndex;

		const newDimensions = dimensions.map( ( dim, i ) => ( {
			...dim,
			primary: on && i === target,
			options: ( dim.options || [] ).map( opt =>
				on && i === target
					? {
							...opt,
							unit_amount: opt.unit_amount || { currency_code: currencyCode, value: '' },
					  }
					: withoutAmount( opt )
			),
		} ) );

		onChange( { variants: { dimensions: newDimensions } } );
	};

	// New buttons always price the first group, but a payment created elsewhere can
	// price a later one - name that group instead of claiming it is the first.
	const pricingHelp =
		primaryIndex > 0
			? sprintf(
					/* translators: %d: variant number */
					__( 'Prices are set on variant %d.', 'jetpack-paypal-payments' ),
					primaryIndex + 1
			  )
			: helpPricingFirstGroup;

	const addGroup = () => {
		if ( dimensions.length >= MAX_GROUPS ) {
			return;
		}
		onChange( {
			variants: {
				dimensions: [ ...dimensions, createGroup() ],
			},
		} );
		setFocusNewGroup( true );
	};

	return (
		<div className="jetpack-paypal-variants">
			<ToggleControl
				label={ __( 'Add variants', 'jetpack-paypal-payments' ) }
				help={ helpVariants }
				checked={ enabled }
				onChange={ setEnabled }
				disabled={ disabled }
			/>

			{ enabled && (
				<>
					{ dimensions.length === 0 && (
						<p className="jetpack-paypal-variants__empty-help">
							{ __(
								'No variants yet. Click "Add Variant" to create one. A variant is a product attribute like Color or Size — add options within each one.',
								'jetpack-paypal-payments'
							) }
						</p>
					) }

					{ dimensions.length > 0 && (
						<CheckboxControl
							label={ __( 'Add price per variant', 'jetpack-paypal-payments' ) }
							help={ pricingHelp }
							checked={ pricingOn }
							onChange={ setPricingEnabled }
							disabled={ disabled }
						/>
					) }

					{ dimensions.map( ( dimension, dimIndex ) => (
						<div
							key={ dimension._key || dimIndex }
							ref={ dimIndex === dimensions.length - 1 ? lastGroupRef : null }
						>
							<GroupEditor
								group={ dimension }
								index={ dimIndex }
								currencyCode={ currencyCode }
								errors={ errors.filter( e => e.group === dimIndex ) }
								touched={ touched }
								showAll={ showAll }
								onTouch={ onTouch }
								onChange={ newDim => updateDimension( dimIndex, newDim ) }
								onRemove={ () => removeDimension( dimIndex ) }
								disabled={ disabled }
							/>
						</div>
					) ) }

					<div className="jetpack-paypal-variants__add-group">
						{ dimensions.length < MAX_GROUPS ? (
							<>
								<Button variant="secondary" onClick={ addGroup } disabled={ disabled }>
									{ __( 'Add Variant', 'jetpack-paypal-payments' ) }
								</Button>
							</>
						) : (
							<p className="jetpack-paypal-variants__limit-notice">
								{ sprintf(
									/* translators: %d: maximum number of groups */
									__( 'Maximum of %d variants reached.', 'jetpack-paypal-payments' ),
									MAX_GROUPS
								) }
							</p>
						) }
					</div>
				</>
			) }
		</div>
	);
}
