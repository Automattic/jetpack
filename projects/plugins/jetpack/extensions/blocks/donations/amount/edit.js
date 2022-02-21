/**
 * External dependencies
 */
import classnames from 'classnames';
import { minimumTransactionAmountForCurrency, parseAmount } from '../../../shared/currencies';

/**
 * Internal dependencies
 */
import DonationsContext from '../common/context';

/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';
import formatCurrency, { CURRENCIES } from '@automattic/format-currency';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from '@wordpress/element';

const Edit = props => {
	const { attributes, setAttributes } = props;
	const { baseAmountMultiplier, label, amount, disabled = false } = attributes;
	const { currency } = useContext( DonationsContext );
	const defaultValue = useMemo(
		() => minimumTransactionAmountForCurrency( currency ) * baseAmountMultiplier,
		[ currency, baseAmountMultiplier ]
	);
	const [ editedValue, setEditedValue ] = useState(
		formatCurrency( amount, currency, { symbol: '' } )
	);
	const [ isFocused, setIsFocused ] = useState( false );
	const [ isInvalid, setIsInvalid ] = useState( false );
	const richTextRef = useRef( null );

	useEffect( () => {
		const newAmount = minimumTransactionAmountForCurrency( currency ) * baseAmountMultiplier;
		setAttributes( { amount: Number( newAmount ), currency } );
	}, [ currency, setAttributes, baseAmountMultiplier ] );

	const setAmount = useCallback(
		newAmount => {
			setEditedValue( newAmount );
			const parsedAmount = parseAmount( newAmount, currency );
			if ( parsedAmount && parsedAmount >= minimumTransactionAmountForCurrency( currency ) ) {
				setAttributes( { amount: Number( parsedAmount ), currency } );
				setIsInvalid( false );
			} else if ( newAmount ) {
				setIsInvalid( true );
			}
		},
		[ currency, setAttributes ]
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
	}, [ currency, editedValue, isFocused, setAmount, defaultValue ] );

	// Syncs the edited value with the actual value whenever the latter changes (e.g. new default amount after a currency change).
	useEffect( () => {
		if ( isFocused || isInvalid ) {
			return;
		}
		setEditedValue( formatCurrency( amount, currency, { symbol: '' } ) );
	}, [ currency, isFocused, isInvalid, setAmount, amount ] );

	return (
		<div
			{ ...useBlockProps( {
				className: classnames( 'wp-block-button wp-block-button__link', {
					'has-focus': isFocused,
					'has-error': isInvalid,
				} ),
			} ) }
			role="button"
			tabIndex={ 0 }
			onClick={ setFocus }
			onKeyDown={ setFocus }
		>
			{ CURRENCIES[ currency ].symbol }
			{ disabled ? (
				<div className="donations__amount-value">
					{ formatCurrency( amount ? amount : defaultValue, currency, { symbol: '' } ) }
				</div>
			) : (
				<RichText
					allowedFormats={ [] }
					aria-label={ label }
					keepPlaceholderOnFocus={ true }
					multiline={ false }
					onChange={ newAmount => setAmount( newAmount ) }
					ref={ richTextRef }
					value={ editedValue }
				/>
			) }
		</div>
	);
};

export default Edit;
