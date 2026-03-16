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

import { Button, TextControl, ToggleControl } from '@wordpress/components';
import { useRef, useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

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
 * @param {boolean} isPrimary - Whether this is the primary group.
 * @return {object} New group object with a stable _key.
 */
function createGroup( isPrimary = false ) {
	return {
		_key: uid(),
		name: '',
		primary: isPrimary,
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
 * Validate variant data and return error messages.
 *
 * @param {boolean} enabled  - Whether variants are enabled.
 * @param {object}  variants - The variants data.
 * @return {Array} Array of error strings. Empty if valid.
 */
export function validateVariants( enabled, variants ) {
	if ( ! enabled || ! variants?.dimensions?.length ) {
		return [];
	}

	const errors = [];

	variants.dimensions.forEach( ( dim, i ) => {
		if ( ! dim.name?.trim() ) {
			errors.push(
				sprintf(
					/* translators: %d: option group number */
					__( 'Option group %d needs a name.', 'jetpack-paypal-payments' ),
					i + 1
				)
			);
		}

		dim.options?.forEach( ( opt, j ) => {
			if ( ! opt.label?.trim() ) {
				errors.push(
					sprintf(
						/* translators: 1: option number, 2: group name or number */
						__( 'Option %1$d in "%2$s" needs a label.', 'jetpack-paypal-payments' ),
						j + 1,
						dim.name || `#${ i + 1 }`
					)
				);
			}

			if ( dim.primary && opt.unit_amount?.value ) {
				const val = parseFloat( opt.unit_amount.value );
				if ( isNaN( val ) || val < 0 ) {
					errors.push(
						sprintf(
							/* translators: 1: option label or number, 2: group name */
							__(
								'Price for "%1$s" in "%2$s" must be a positive number.',
								'jetpack-paypal-payments'
							),
							opt.label || `Option ${ j + 1 }`,
							dim.name || `#${ i + 1 }`
						)
					);
				}
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
 * @param {Function} props.onChange     - Callback when group changes.
 * @param {Function} props.onRemove     - Callback to remove this group.
 * @param {Function} props.onSetPrimary - Callback to set this as primary.
 * @param {boolean}  props.disabled     - Whether inputs are disabled.
 * @return {Element} Group editor.
 */
function GroupEditor( { group, index, currencyCode, onChange, onRemove, onSetPrimary, disabled } ) {
	const lastOptionRef = useRef( null );
	const [ focusNewOption, setFocusNewOption ] = useState( false );

	// Focus newly added option.
	useEffect( () => {
		if ( focusNewOption && lastOptionRef.current ) {
			lastOptionRef.current.querySelector( 'input' )?.focus();
			setFocusNewOption( false );
		}
	}, [ focusNewOption ] );

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
			/* translators: %d: group number */
			__( 'Option group %d', 'jetpack-paypal-payments' ),
			index + 1
		);

	return (
		<div className="jetpack-paypal-variants__group" role="group" aria-label={ groupLabel }>
			<div className="jetpack-paypal-variants__group-header">
				<TextControl
					label={ sprintf(
						/* translators: %d: group number */
						__( 'Option group %d', 'jetpack-paypal-payments' ),
						index + 1
					) }
					value={ group.name }
					onChange={ updateName }
					placeholder={
						index === 0
							? __( 'e.g., Color', 'jetpack-paypal-payments' )
							: __( 'e.g., Size', 'jetpack-paypal-payments' )
					}
					disabled={ disabled }
				/>
				<div className="jetpack-paypal-variants__group-controls">
					<ToggleControl
						label={ __( 'Set price per option', 'jetpack-paypal-payments' ) }
						help={
							group.primary
								? __( 'Each option can have its own price.', 'jetpack-paypal-payments' )
								: __( 'Enable to charge different prices per option.', 'jetpack-paypal-payments' )
						}
						checked={ group.primary }
						onChange={ () => onSetPrimary( index ) }
						disabled={ disabled }
					/>
					<Button
						isDestructive
						isSmall
						variant="tertiary"
						onClick={ onRemove }
						disabled={ disabled }
						aria-label={ sprintf(
							/* translators: %s: group name */
							__( 'Remove option group "%s"', 'jetpack-paypal-payments' ),
							groupLabel
						) }
					>
						{ __( 'Remove', 'jetpack-paypal-payments' ) }
					</Button>
				</div>
			</div>

			<div className="jetpack-paypal-variants__options">
				{ group.options.map( ( option, optIndex ) => (
					<div
						key={ option._key }
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
							placeholder={ __( 'e.g., Black', 'jetpack-paypal-payments' ) }
							disabled={ disabled }
						/>
						{ group.primary && (
							<TextControl
								label={ __( 'Price', 'jetpack-paypal-payments' ) }
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
								min="0.01"
								step="0.01"
								placeholder={ __( 'Same as base price', 'jetpack-paypal-payments' ) }
								disabled={ disabled }
								help={ __( 'Leave empty to use the base price.', 'jetpack-paypal-payments' ) }
							/>
						) }
						{ group.options.length > 1 && (
							<Button
								isSmall
								isDestructive
								variant="tertiary"
								onClick={ () => removeOption( optIndex ) }
								disabled={ disabled }
								aria-label={ sprintf(
									/* translators: 1: option number, 2: group name */
									__( 'Remove option %1$d from "%2$s"', 'jetpack-paypal-payments' ),
									optIndex + 1,
									groupLabel
								) }
								className="jetpack-paypal-variants__remove-option"
							>
								{ __( 'Remove', 'jetpack-paypal-payments' ) }
							</Button>
						) }
					</div>
				) ) }

				<div className="jetpack-paypal-variants__option-actions">
					{ group.options.length < MAX_OPTIONS ? (
						<Button isSmall variant="secondary" onClick={ addOption } disabled={ disabled }>
							{ __( 'Add Option', 'jetpack-paypal-payments' ) }
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
 * @return {Element} Variants builder.
 */
export default function VariantBuilder( {
	enabled,
	variants,
	currencyCode = 'USD',
	onChange,
	disabled,
} ) {
	const dimensions = variants?.dimensions || [];
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
				variants: { dimensions: [ createGroup( true ) ] },
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

	const setPrimary = dimIndex => {
		const newDimensions = dimensions.map( ( dim, i ) => ( {
			...dim,
			primary: i === dimIndex,
			options:
				i === dimIndex
					? dim.options.map( opt => ( {
							...opt,
							unit_amount: opt.unit_amount || { currency_code: currencyCode, value: '' },
					  } ) )
					: dim.options.map( ( { _key, label } ) => ( { _key, label } ) ),
		} ) );
		onChange( { variants: { dimensions: newDimensions } } );
	};

	const addGroup = () => {
		if ( dimensions.length >= MAX_GROUPS ) {
			return;
		}
		onChange( {
			variants: {
				dimensions: [ ...dimensions, createGroup( false ) ],
			},
		} );
		setFocusNewGroup( true );
	};

	return (
		<div className="jetpack-paypal-variants">
			<h4 className="jetpack-paypal-variants__heading">
				{ __( 'Product Options', 'jetpack-paypal-payments' ) }
			</h4>

			<ToggleControl
				label={ __( 'Enable product options', 'jetpack-paypal-payments' ) }
				help={
					enabled
						? __(
								'Customers choose options (e.g., size, color) at checkout.',
								'jetpack-paypal-payments'
						  )
						: __( 'Add size, color, or other product options.', 'jetpack-paypal-payments' )
				}
				checked={ enabled }
				onChange={ setEnabled }
				disabled={ disabled }
			/>

			{ enabled && (
				<>
					{ dimensions.length === 0 && (
						<p className="jetpack-paypal-variants__empty-help">
							{ __(
								'No option groups yet. Click "Add option group" to create one. An option group is a product attribute like Color or Size — add choices within each group.',
								'jetpack-paypal-payments'
							) }
						</p>
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
								onChange={ newDim => updateDimension( dimIndex, newDim ) }
								onRemove={ () => removeDimension( dimIndex ) }
								onSetPrimary={ setPrimary }
								disabled={ disabled }
							/>
						</div>
					) ) }

					<div className="jetpack-paypal-variants__add-group">
						{ dimensions.length < MAX_GROUPS ? (
							<>
								<Button variant="secondary" onClick={ addGroup } disabled={ disabled }>
									{ __( 'Add option group', 'jetpack-paypal-payments' ) }
								</Button>
								{ dimensions.length > 0 && (
									<span className="jetpack-paypal-variants__counter">
										{ sprintf(
											/* translators: 1: current count, 2: maximum */
											__( '%1$d / %2$d groups', 'jetpack-paypal-payments' ),
											dimensions.length,
											MAX_GROUPS
										) }
									</span>
								) }
							</>
						) : (
							<p className="jetpack-paypal-variants__limit-notice">
								{ sprintf(
									/* translators: %d: maximum number of groups */
									__( 'Maximum of %d option groups reached.', 'jetpack-paypal-payments' ),
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
