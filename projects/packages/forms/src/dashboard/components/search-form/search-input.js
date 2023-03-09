/**
 * External dependencies
 */
import { SearchIcon } from '@automattic/jetpack-components';
import { Spinner } from '@wordpress/components';
import { useDebounce } from '@wordpress/compose';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, closeSmall } from '@wordpress/icons';
import classnames from 'classnames';
/**
 * Internal dependencies
 */
import './style.scss';

const InputWrapper = ( {
	className,
	disabled = false,
	loading = false,
	icon = null,
	endAdornment = null,
	onChange,
	onEnter,
	...inputProps
} ) => {
	const handleChangeEvent = useCallback(
		e => {
			if ( onChange != null ) {
				onChange( e.currentTarget.value );
			}
		},
		[ onChange ]
	);

	const handleKeyUpEvent = useCallback(
		e => {
			if ( onEnter != null && [ 'Enter', 'NumpadEnter' ].includes( e.code ) ) {
				onEnter( e.currentTarget.value );
			}
		},
		[ onEnter ]
	);

	const baseProps = {
		className: classnames( 'input', {
			'with-icon': icon != null,
		} ),
		onChange: handleChangeEvent,
		onKeyUp: handleKeyUpEvent,
		disabled: disabled,
		[ 'aria-disabled' ]: disabled,
	};

	return (
		<div
			className={ classnames( className, 'input-wrapper', {
				disabled: disabled,
			} ) }
		>
			<>
				{ loading || icon ? (
					<div
						className={ classnames( 'icon-wrapper', {
							loader: loading,
						} ) }
					>
						{ loading ? <Spinner /> : icon }
					</div>
				) : null }
				<input { ...inputProps } { ...baseProps } value={ inputProps.value } />
				{ endAdornment }
			</>
		</div>
	);
};

export const Input = ( { name, className, ...wrapperProps } ) => {
	return <InputWrapper className={ className } { ...wrapperProps } />;
};

export const SearchInput = ( {
	placeholder = __( 'Search responses', 'jetpack-forms' ),
	onSearch,
	wait = 500,
	...componentProps
} ) => {
	const debouncedOnChange = useDebounce( onSearch, wait );

	const { onEnter, onChange } = componentProps;

	const onEnterHandler = useCallback(
		value => {
			onEnter && onEnter( value );
			onSearch( value );
		},
		[ onEnter, onSearch ]
	);

	const onChangeHandler = useCallback(
		value => {
			onChange && onChange( value );
			debouncedOnChange( value );
		},
		[ onChange, debouncedOnChange ]
	);

	const clearInput = useCallback( () => {
		onChange && onChange( '' );
		onSearch( '' );
	}, [ onChange, onSearch ] );

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
						<div className={ classnames( 'icon-wrapper' ) }>
							<Icon
								icon={ closeSmall }
								onClick={ clearInput }
								className={ classnames( 'clear-icon' ) }
							/>
						</div>
					) }
				</>
			}
		/>
	);
};

export default Input;
