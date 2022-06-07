import formatCurrency, { CURRENCIES } from '@automattic/format-currency';
import { RichText } from '@wordpress/block-editor';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import classnames from 'classnames';
import { minimumTransactionAmountForCurrency, parseAmount } from '../../shared/currencies';

const Amount = ( {
	className = null,
	currency = null,
	defaultValue = null,
	disabled = false,
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
		<div
			className={ classnames( 'donations__amount', className, {
				'has-focus': isFocused,
				'has-error': isInvalid,
			} ) }
			role="button"
			tabIndex={ 0 }
			onClick={ setFocus }
			onKeyDown={ setFocus }
		>
			{ CURRENCIES[ currency ].symbol }
			{ disabled ? (
				<div className="donations__amount-value">
					{ formatCurrency( value ? value : defaultValue, currency, { symbol: '' } ) }
				</div>
			) : (
				<RichText
					allowedFormats={ [] }
					aria-label={ label }
					multiline={ false }
					onChange={ amount => setAmount( amount ) }
					placeholder={ formatCurrency( defaultValue, currency, { symbol: '' } ) }
					ref={ richTextRef }
					value={ editedValue }
					withoutInteractiveFormatting
				/>
			) }
		</div>
	);
};

export default Amount;
