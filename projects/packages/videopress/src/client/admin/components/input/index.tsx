/**
 * External dependencies
 */
import { Text, SearchIcon } from '@automattic/jetpack-components';
import { Spinner } from '@wordpress/components';
import { useDebounce } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { Icon, closeSmall } from '@wordpress/icons';
import clsx from 'clsx';
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
	loading = false,
	icon = null,
	endAdornment = null,
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
			if ( onEnter != null && [ 'Enter', 'NumpadEnter' ].includes( e.code ) ) {
				onEnter( e.currentTarget.value );
			}
		},
		[ onEnter ]
	);

	const baseProps = {
		className: clsx( styles.input, {
			[ styles[ 'with-icon' ] ]: icon != null,
		} ),
		onChange: handleChangeEvent,
		onKeyUp: handleKeyUpEvent,
		disabled: disabled,
		[ 'aria-disabled' ]: disabled,
	};

	const isTextarea = inputProps?.type === 'textarea';

	return (
		<div
			className={ clsx( className, styles[ 'input-wrapper' ], {
				[ styles.disabled ]: disabled,
				[ styles.large ]: size === 'large',
				[ styles[ 'is-textarea' ] ]: isTextarea,
			} ) }
		>
			{ isTextarea ? (
				<textarea { ...inputProps } { ...baseProps } />
			) : (
				<>
					{ loading || icon ? (
						<div
							className={ clsx( styles[ 'icon-wrapper' ], {
								[ styles.loader ]: loading,
							} ) }
						>
							{ loading ? <Spinner /> : icon }
						</div>
					) : null }
					<input { ...inputProps } { ...baseProps } value={ inputProps.value } />
					{ endAdornment }
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
		<InputWrapper className={ className } size={ size } { ...wrapperProps } />
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

	const clearInput = useCallback( () => {
		componentProps.onChange?.( '' );
		onSearch( '' );
	}, [ componentProps.onChange ] );

	return (
		<Input
			{ ...componentProps }
			icon={ <SearchIcon size={ 24 } /> }
			placeholder={ placeholder }
			type="text"
			onEnter={ onEnterHandler }
			onChange={ onChangeHandler }
			endAdornment={
				<>
					{ Boolean( componentProps.value ) && (
						<div className={ clsx( styles[ 'icon-wrapper' ] ) }>
							<Icon
								icon={ closeSmall }
								onClick={ clearInput }
								className={ clsx( styles[ 'clear-icon' ] ) }
							/>
						</div>
					) }
				</>
			}
		/>
	);
};

export default Input;
