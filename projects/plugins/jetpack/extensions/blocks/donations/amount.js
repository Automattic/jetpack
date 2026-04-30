import { getCurrencyObject } from '@automattic/format-currency';
import { RichText } from '@wordpress/block-editor';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import clsx from 'clsx';
import { minimumTransactionAmountForCurrency, parseAmount } from '../../shared/currencies';

const formatAmountWithoutSymbol = ( value, currency ) => {
	const { sign, integer, fraction } = getCurrencyObject( value, currency );
	return sign + integer + fraction;
};

const Amount = ( {
	className = null,
	currency = null,
	defaultValue = null,
	disabled = false,
	label = '',
	onChange = null,
	value = '',
} ) => {
	const [ editedValue, setEditedValue ] = useState( formatAmountWithoutSymbol( value, currency ) );
	const [ isFocused, setIsFocused ] = useState( false );
	const [ isInvalid, setIsInvalid ] = useState( false );
	const richTextRef = useRef( null );

	const setAmount = useCallback(
		( amount, shouldSync ) => {
			setEditedValue( currentAmount => {
				// Validate the amount only when it changes.
				if ( amount !== currentAmount ) {
					const parsedAmount = parseAmount( amount );
					if ( parsedAmount && parsedAmount >= minimumTransactionAmountForCurrency( currency ) ) {
						setIsInvalid( false );
						if ( shouldSync ) {
							onChange?.( parsedAmount );
						}
					} else {
						setIsInvalid( true );
					}
				}

				return amount;
			} );
		},
		[ currency, onChange ]
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

		const _ref = richTextRef.current;

		const onBlur = () => {
			setIsFocused( false );
			if ( ! editedValue ) {
				setAmount( formatAmountWithoutSymbol( defaultValue, currency ) );
			}
		};

		_ref.addEventListener( 'blur', onBlur );

		return () => {
			_ref.removeEventListener( 'blur', onBlur );
		};
	}, [ currency, defaultValue, editedValue, richTextRef, setAmount ] );

	// Syncs the edited value with the actual value whenever the latter changes (e.g. new default amount after a currency change).
	useEffect( () => {
		if ( isFocused || isInvalid ) {
			return;
		}
		setEditedValue( formatAmountWithoutSymbol( value, currency ) );
	}, [ currency, isFocused, isInvalid, value ] );

	useEffect( () => {
		setAmount( formatAmountWithoutSymbol( value, currency ) );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ currency, value ] );

	return (
		<div
			className={ clsx( 'donations__amount', className, {
				'has-focus': isFocused,
				'has-error': isInvalid,
			} ) }
			role="button"
			tabIndex={ 0 }
			onClick={ setFocus }
			onKeyDown={ setFocus }
		>
			{ getCurrencyObject( 0, currency ).symbol }
			{ disabled ? (
				<div className="donations__amount-value">
					{ formatAmountWithoutSymbol( value ? value : defaultValue, currency ) }
				</div>
			) : (
				<RichText
					allowedFormats={ [] }
					aria-label={ label }
					onChange={ amount => setAmount( amount, true ) }
					placeholder={ formatAmountWithoutSymbol( defaultValue, currency ) }
					ref={ richTextRef }
					value={ editedValue }
					withoutInteractiveFormatting
				/>
			) }
		</div>
	);
};

export default Amount;
