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
import { minimumTransactionAmountForCurrency, parseAmount } from '../../../../shared/currencies';

const Edit = props => {
	const { value, currency, className } = props;
	const [ editedValue, setEditedValue ] = useState(
		formatCurrency( value, currency, { symbol: '' } )
	);
	const [ isFocused, setIsFocused ] = useState( false );
	const [ isInvalid, setIsInvalid ] = useState( false );
	const richTextRef = useRef( null );

	const setAmount = useCallback(
		amount => {
			setEditedValue( amount );

			const parsedAmount = parseAmount( amount, currency );
			if ( parsedAmount && parsedAmount >= minimumTransactionAmountForCurrency( currency ) ) {
				setIsInvalid( false );
			} else if ( amount ) {
				setIsInvalid( true );
			}
		},
		[ currency ]
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
			<RichText
				allowedFormats={ [] }
				aria-label={ value }
				keepPlaceholderOnFocus={ true }
				multiline={ false }
				onChange={ amount => setAmount( amount ) }
				placeholder={ formatCurrency( value, currency, { symbol: '' } ) }
				ref={ richTextRef }
				value={ editedValue }
				withoutInteractiveFormatting
			/>
		</div>
	);
};

export default Edit;
