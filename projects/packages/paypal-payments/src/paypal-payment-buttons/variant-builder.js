/* eslint-disable react/jsx-no-bind */
/**
 * Product Variants Dimension Builder.
 *
 * Reusable component for building product variant dimensions
 * (e.g., Color, Size) with options and optional per-option pricing.
 *
 * @package
 * @since 0.9.0
 */

import { Button, TextControl, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

// Pre-extract translated strings used in ternaries to avoid i18n build errors.
const placeholderColor = __( 'e.g., Color', 'jetpack-paypal-payments' );
const placeholderSize = __( 'e.g., Size', 'jetpack-paypal-payments' );
const helpEnabled = __(
	'Customers choose options (e.g., size, color) at checkout.',
	'jetpack-paypal-payments'
);
const helpDisabled = __( 'Add size, color, or other product options.', 'jetpack-paypal-payments' );

const MAX_DIMENSIONS = 5;
const MAX_OPTIONS = 10;

/**
 * Create a new empty dimension.
 *
 * @param {boolean} isPrimary - Whether this is the primary dimension.
 * @return {object} New dimension object.
 */
function createDimension( isPrimary = false ) {
	return {
		name: '',
		primary: isPrimary,
		options: [ { label: '' } ],
	};
}

/**
 * Create a new empty option.
 *
 * @param {boolean} withPricing - Whether to include pricing fields.
 * @param {string}  currency    - Currency code for pricing.
 * @return {object} New option object.
 */
function createOption( withPricing = false, currency = 'USD' ) {
	const opt = { label: '' };
	if ( withPricing ) {
		opt.unit_amount = { currency_code: currency, value: '' };
	}
	return opt;
}

/**
 * Single dimension editor with its options.
 *
 * @param {object}   props              - Component props.
 * @param {object}   props.dimension    - The dimension data.
 * @param {number}   props.index        - Dimension index.
 * @param {string}   props.currencyCode - Product currency for pricing.
 * @param {Function} props.onChange     - Callback when dimension changes.
 * @param {Function} props.onRemove     - Callback to remove this dimension.
 * @param {Function} props.onSetPrimary - Callback to set this as primary.
 * @param {boolean}  props.disabled     - Whether inputs are disabled.
 * @return {Element} Dimension editor.
 */
function DimensionEditor( {
	dimension,
	index,
	currencyCode,
	onChange,
	onRemove,
	onSetPrimary,
	disabled,
} ) {
	const updateName = name => {
		onChange( { ...dimension, name } );
	};

	const updateOption = ( optIndex, updates ) => {
		const newOptions = [ ...dimension.options ];
		newOptions[ optIndex ] = { ...newOptions[ optIndex ], ...updates };
		onChange( { ...dimension, options: newOptions } );
	};

	const addOption = () => {
		if ( dimension.options.length >= MAX_OPTIONS ) {
			return;
		}
		onChange( {
			...dimension,
			options: [ ...dimension.options, createOption( dimension.primary, currencyCode ) ],
		} );
	};

	const removeOption = optIndex => {
		const newOptions = dimension.options.filter( ( _, i ) => i !== optIndex );
		onChange( { ...dimension, options: newOptions } );
	};

	return (
		<div className="jetpack-paypal-variants__dimension">
			<div className="jetpack-paypal-variants__dimension-header">
				<TextControl
					label={ `${ __( 'Dimension', 'jetpack-paypal-payments' ) } ${ index + 1 }` }
					value={ dimension.name }
					onChange={ updateName }
					placeholder={ index === 0 ? placeholderColor : placeholderSize }
					disabled={ disabled }
				/>
				<div className="jetpack-paypal-variants__dimension-controls">
					<ToggleControl
						label={ __( 'Primary (has pricing)', 'jetpack-paypal-payments' ) }
						checked={ dimension.primary }
						onChange={ () => onSetPrimary( index ) }
						disabled={ disabled }
					/>
					<Button
						isDestructive
						isSmall
						variant="tertiary"
						onClick={ onRemove }
						disabled={ disabled }
					>
						{ __( 'Remove', 'jetpack-paypal-payments' ) }
					</Button>
				</div>
			</div>

			<div className="jetpack-paypal-variants__options">
				{ dimension.options.map( ( option, optIndex ) => (
					<div key={ optIndex } className="jetpack-paypal-variants__option">
						<TextControl
							label={ `${ __( 'Option', 'jetpack-paypal-payments' ) } ${ optIndex + 1 }` }
							value={ option.label }
							onChange={ label => updateOption( optIndex, { label } ) }
							placeholder={ __( 'e.g., Black', 'jetpack-paypal-payments' ) }
							disabled={ disabled }
						/>
						{ dimension.primary && (
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
								placeholder={ __( 'Same as base', 'jetpack-paypal-payments' ) }
								disabled={ disabled }
							/>
						) }
						{ dimension.options.length > 1 && (
							<Button
								isSmall
								isDestructive
								variant="tertiary"
								onClick={ () => removeOption( optIndex ) }
								disabled={ disabled }
							>
								×
							</Button>
						) }
					</div>
				) ) }

				{ dimension.options.length < MAX_OPTIONS && (
					<Button isSmall variant="secondary" onClick={ addOption } disabled={ disabled }>
						{ __( 'Add Option', 'jetpack-paypal-payments' ) }
					</Button>
				) }
			</div>
		</div>
	);
}

/**
 * Product Variants builder panel.
 *
 * @param {object}   props              - Component props.
 * @param {boolean}  props.enabled      - Whether variants are enabled.
 * @param {object}   props.variants     - The variants data.
 * @param {string}   props.currencyCode - Product currency code.
 * @param {Function} props.onChange     - Callback with { variantsEnabled, variants }.
 * @param {boolean}  props.disabled     - Whether inputs are disabled.
 * @return {Element} Variants builder panel.
 */
export default function VariantBuilder( {
	enabled,
	variants,
	currencyCode = 'USD',
	onChange,
	disabled,
} ) {
	const dimensions = variants?.dimensions || [];

	const setEnabled = newEnabled => {
		if ( newEnabled && dimensions.length === 0 ) {
			// Start with one empty primary dimension.
			onChange( {
				variantsEnabled: true,
				variants: { dimensions: [ createDimension( true ) ] },
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
			// Strip pricing from non-primary options.
			options:
				i === dimIndex
					? dim.options.map( opt => ( {
							...opt,
							unit_amount: opt.unit_amount || { currency_code: currencyCode, value: '' },
					  } ) )
					: dim.options.map( ( { label } ) => ( { label } ) ),
		} ) );
		onChange( { variants: { dimensions: newDimensions } } );
	};

	const addDimension = () => {
		if ( dimensions.length >= MAX_DIMENSIONS ) {
			return;
		}
		onChange( {
			variants: {
				dimensions: [ ...dimensions, createDimension( false ) ],
			},
		} );
	};

	return (
		<div className="jetpack-paypal-variants">
			<ToggleControl
				label={ __( 'Enable product variants', 'jetpack-paypal-payments' ) }
				help={ enabled ? helpEnabled : helpDisabled }
				checked={ enabled }
				onChange={ setEnabled }
				disabled={ disabled }
			/>

			{ enabled && (
				<>
					{ dimensions.map( ( dimension, dimIndex ) => (
						<DimensionEditor
							key={ dimIndex }
							dimension={ dimension }
							index={ dimIndex }
							currencyCode={ currencyCode }
							onChange={ newDim => updateDimension( dimIndex, newDim ) }
							onRemove={ () => removeDimension( dimIndex ) }
							onSetPrimary={ setPrimary }
							disabled={ disabled }
						/>
					) ) }

					{ dimensions.length < MAX_DIMENSIONS && (
						<Button
							variant="secondary"
							onClick={ addDimension }
							disabled={ disabled }
							className="jetpack-paypal-variants__add-dimension"
						>
							{ __( 'Add Dimension', 'jetpack-paypal-payments' ) }
						</Button>
					) }
				</>
			) }
		</div>
	);
}
