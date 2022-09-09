/**
 * External dependencies
 */
import { Text, SearchIcon } from '@automattic/jetpack-components';
import { useDebounce } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
import { useCallback, ChangeEvent, KeyboardEvent } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.scss';
import { InputProps, SearchInputProps } from './types';
import type React from 'react';

const InputWrapper = ( {
	className,
	disabled = false,
	icon = null,
	onChange,
	onEnter,
	size = 'small',
	...inputProps
}: InputProps ) => {
	const handleChangeEvent = useCallback(
		( e: ChangeEvent< HTMLInputElement | HTMLTextAreaElement > ) => {
			if ( onChange != null ) {
				onChange( e.currentTarget.value );
			}
		},
		[ onChange ]
	);

	const handleKeyUpEvent = useCallback(
		( e: KeyboardEvent< HTMLInputElement | HTMLTextAreaElement > ) => {
			if ( onEnter != null && e.code === 'Enter' ) {
				onEnter( e.currentTarget.value );
			}
		},
		[ onEnter ]
	);

	const baseProps = {
		className: classnames( styles.input, {
			[ styles[ 'with-icon' ] ]: icon != null,
		} ),
		onChange: handleChangeEvent,
		onKeyUp: handleKeyUpEvent,
		disabled: disabled,
		[ 'aria-disabled' ]: disabled,
	};

	return (
		<div
			className={ classnames( className, styles[ 'input-wrapper' ], {
				[ styles.disabled ]: disabled,
				[ styles.large ]: size === 'large',
			} ) }
		>
			{ inputProps?.type === 'textarea' ? (
				<textarea { ...inputProps } { ...baseProps } />
			) : (
				<>
					{ icon }
					<input { ...inputProps } { ...baseProps } />
				</>
			) }
		</div>
	);
};

/**
 * Input component
 *
 * @param {InputProps} props - Component props.
 * @returns {React.ReactNode} - Input react component.
 */
export const Input = ( {
	name,
	label,
	className,
	size = 'small',
	...wrapperProps
}: InputProps ) => {
	return label ? (
		<div className={ className }>
			<Text
				component="label"
				variant={ size === 'small' ? 'body-small' : 'body' }
				htmlFor={ name }
				mb={ 1 }
				className={ styles.label }
			>
				{ label }
			</Text>
			<InputWrapper name={ name } size={ size } { ...wrapperProps } />
		</div>
	) : (
		<InputWrapper className={ className } { ...wrapperProps } />
	);
};

/**
 * Search Input component
 *
 * @param {InputProps} props - Component props.
 * @returns {React.ReactNode} - Input react component.
 */
export const SearchInput = ( {
	placeholder = __( 'Search your library', 'jetpack-videopress-pkg' ),
	onSearch,
	wait = 500,
	...componentProps
}: SearchInputProps ) => {
	const debouncedOnChange = useDebounce( onSearch, wait );

	const onEnterHandler = useCallback(
		( value: string ) => {
			componentProps.onEnter?.( value );
			onSearch( value );
		},
		[ componentProps.onEnter, onSearch ]
	);

	const onChangeHandler = useCallback(
		( value: string ) => {
			componentProps.onChange?.( value );
			debouncedOnChange( value );
		},
		[ componentProps.onChange ]
	);

	return (
		<Input
			{ ...componentProps }
			icon={ <SearchIcon size={ 24 } /> }
			placeholder={ placeholder }
			type="text"
			onEnter={ onEnterHandler }
			onChange={ onChangeHandler }
		/>
	);
};

export default Input;
