/**
 * External dependencies
 */
import formatCurrency, { CURRENCIES } from '@automattic/format-currency';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { minimumTransactionAmountForCurrency } from '../../shared/currencies';

const Amount = ( {
	className = '',
	currency = null,
	defaultValue = null,
	editable = false,
	label = '',
	onChange = null,
	value = '',
} ) => {
	const [ editedValue, setEditedValue ] = useState(
		formatCurrency( value, currency, { symbol: '' } )
	);
	const [ isFocused, setIsFocused ] = useState( false );
	const [ isInvalid, setIsInvalid ] = useState( false );
	const richTextRef = useRef( null );

	const parseAmount = useCallback(
		amount => {
			if ( ! amount ) {
				return null;
			}

			if ( typeof amount === 'number' ) {
				return amount;
			}

			amount = parseFloat(
				amount
					// Remove any thousand grouping separator.
					.replace( new RegExp( '\\' + CURRENCIES[ currency ].grouping, 'g' ), '' )
					// Replace the localized decimal separator with a dot (the standard decimal separator in float numbers).
					.replace( new RegExp( '\\' + CURRENCIES[ currency ].decimal, 'g' ), '.' )
			);

			if ( isNaN( amount ) ) {
				return null;
			}

			return amount;
		},
		[ currency ]
	);

	const setAmount = useCallback(
		amount => {
			setEditedValue( amount );

			if ( ! onChange ) {
				return;
			}

			const parsedAmount = parseAmount( amount, currency );
			if ( parsedAmount && parsedAmount >= minimumTransactionAmountForCurrency( currency ) ) {
				onChange( parsedAmount );
				setIsInvalid( false );
			} else if ( amount ) {
				setIsInvalid( true );
			}
		},
		[ currency, parseAmount, onChange ]
	);

	const setFocus = () => {
		if ( ! richTextRef.current ) {
			return;
		}

		richTextRef.current.focus();
		setIsFocused( true );
	};

	// Tracks when user clicks out the input. Cannot be done with an `onBlur` prop because `RichText` does not support it.
	useEffect( () => {
		if ( ! richTextRef.current ) {
			return;
		}

		richTextRef.current.addEventListener( 'blur', () => setIsFocused( false ) );
	}, [ richTextRef ] );

	// Sets a default value if empty when user clicks out the input.
	useEffect( () => {
		if ( isFocused || editedValue ) {
			return;
		}

		setAmount( formatCurrency( defaultValue, currency, { symbol: '' } ) );
	}, [ currency, defaultValue, editedValue, isFocused, setAmount ] );

	// Syncs the edited value with the actual value whenever the latter changes (e.g. new default amount after a currency change).
	useEffect( () => {
		if ( isFocused || isInvalid ) {
			return;
		}
		setEditedValue( formatCurrency( value, currency, { symbol: '' } ) );
	}, [ currency, isFocused, isInvalid, setAmount, value ] );

	return (
		<div className={ classnames( 'wp-block-button', 'donations__amount', className ) }>
			<div
				className={ classnames( 'wp-block-button__link', {
					'has-focus': isFocused,
					'has-error': isInvalid,
				} ) }
				onClick={ setFocus }
				onKeyDown={ setFocus }
				role="button"
				tabIndex={ 0 }
			>
				{ CURRENCIES[ currency ].symbol }
				{ editable ? (
					<RichText
						allowedFormats={ [] }
						aria-label={ label }
						keepPlaceholderOnFocus={ true }
						multiline={ false }
						onChange={ amount => setAmount( amount ) }
						placeholder={ formatCurrency( defaultValue, currency, { symbol: '' } ) }
						ref={ richTextRef }
						value={ editedValue }
						withoutInteractiveFormatting
					/>
				) : (
					<span className="donations__amount-value">
						{ formatCurrency( value ? value : defaultValue, currency, { symbol: '' } ) }
					</span>
				) }
			</div>
		</div>
	);
};

export default Amount;
