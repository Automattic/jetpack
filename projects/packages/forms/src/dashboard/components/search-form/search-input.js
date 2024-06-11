/**
 * External dependencies
 */
import { SearchIcon } from '@automattic/jetpack-components';
import { Spinner } from '@wordpress/components';
import { useDebounce } from '@wordpress/compose';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, closeSmall } from '@wordpress/icons';
import clsx from 'clsx';
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';

const Input = ( {
	className,
	disabled = false,
	endAdornment = null,
	icon = null,
	loading = false,
	...inputProps
} ) => {
	return (
		<div
			className={ clsx( className, 'input-wrapper', {
				disabled: disabled,
			} ) }
		>
			<>
				{ ( loading || icon ) && (
					<div
						className={ clsx( 'icon-wrapper', {
							loader: loading,
						} ) }
					>
						{ loading ? <Spinner /> : icon }
					</div>
				) }
				<input
					aria-disabled={ disabled }
					className={ clsx( 'input', {
						'with-icon': icon !== null,
					} ) }
					disabled={ disabled }
					type="text"
					{ ...inputProps }
				/>
				{ endAdornment }
			</>
		</div>
	);
};

const SearchInput = ( {
	initialValue,
	loading,
	placeholder = __( 'Search responses', 'jetpack-forms' ),
	onSearch = noop,
	wait = 500,
	...componentProps
} ) => {
	const [ searchText, setSearchText ] = useState( initialValue );
	const debouncedOnChange = useDebounce( onSearch, wait );

	const onChangeHandler = useCallback(
		event => {
			setSearchText( event.target.value );
			debouncedOnChange( event.target.value );
		},
		[ debouncedOnChange ]
	);

	const onKeyUpHandler = useCallback(
		event => {
			if ( [ 'Enter', 'NumpadEnter' ].includes( event.code ) ) {
				onSearch( event.currentTarget.value );
			}
		},
		[ onSearch ]
	);

	const clearInput = useCallback( () => {
		setSearchText( '' );
		onSearch( '' );
	}, [ onSearch ] );

	return (
		<Input
			{ ...componentProps }
			icon={ <SearchIcon size={ 24 } /> }
			loading={ loading }
			placeholder={ placeholder }
			onChange={ onChangeHandler }
			onKeyUp={ onKeyUpHandler }
			value={ searchText }
			endAdornment={
				<div className={ clsx( 'icon-wrapper', { hidden: ! searchText } ) }>
					<Icon icon={ closeSmall } onClick={ clearInput } className={ clsx( 'clear-icon' ) } />
				</div>
			}
		/>
	);
};

export default SearchInput;
