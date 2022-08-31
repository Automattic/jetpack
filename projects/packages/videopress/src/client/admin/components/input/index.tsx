/**
 * External dependencies
 */
import { SearchIcon } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
import { useCallback, ChangeEvent, KeyboardEvent } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.scss';
import { InputProps, SearchInputProps } from './types';
import type React from 'react';

/**
 * Input component
 *
 * @param {InputProps} props - Component props.
 * @returns {React.ReactNode} - Input react component.
 */
export const Input: React.FC< InputProps > = ( {
	className,
	value,
	placeholder,
	icon,
	onChange,
	onEnter,
} ) => {
	const hasIcon = icon != null;

	const handleChangeEvent = useCallback(
		( e: ChangeEvent< HTMLInputElement > ) => {
			if ( onChange != null ) {
				onChange( e.currentTarget.value );
			}
		},
		[ onChange ]
	);

	const handleKeyDownEvent = useCallback(
		( e: KeyboardEvent< HTMLInputElement > ) => {
			if ( onEnter != null && e.key === 'Enter' ) {
				onEnter( e.currentTarget.value );
			}
		},
		[ onEnter ]
	);

	return (
		<div className={ classnames( className, styles.wrapper ) }>
			{ hasIcon && icon }
			<input
				placeholder={ placeholder }
				value={ value }
				className={ classnames( styles.input, { [ styles[ 'with-icon' ] ]: hasIcon } ) }
				onChange={ handleChangeEvent }
				onKeyDown={ handleKeyDownEvent }
			/>
		</div>
	);
};

/**
 * Search Input component
 *
 * @param {InputProps} props - Component props.
 * @returns {React.ReactNode} - Input react component.
 */
export const SearchInput: React.FC< SearchInputProps > = ( {
	placeholder = __( 'Search your library', 'jetpack-videopress-pkg' ),
	...componentProps
} ) => {
	return (
		<Input
			{ ...componentProps }
			icon={ <SearchIcon size={ 24 } /> }
			placeholder={ placeholder }
		></Input>
	);
};

export default Input;
