import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';
import { chevronDown } from '@wordpress/icons';
import { find, first, isNil, map, noop } from 'lodash';

const DropdownFilter = ( { options = [], onChange = noop, value } ) => {
	const dropdownLabel = useMemo( () => {
		if ( isNil( value ) ) {
			const firstOption = first( options );
			return firstOption?.label || '';
		}

		return find( options, o => o.value === value )?.label || '';
	}, [ options, value ] );

	const onFilterHandler = useCallback(
		( data, onClose ) => () => {
			onChange( data.value );
			onClose();
		},
		[ onChange ]
	);

	return (
		<DropdownMenu
			text={ dropdownLabel }
			icon={ chevronDown }
			popoverProps={ { placement: 'bottom-end' } }
			toggleProps={ { variant: 'secondary', iconPosition: 'right' } }
		>
			{ ( { onClose } ) => (
				<MenuGroup>
					{ map( options, option => (
						<MenuItem key={ option.value } onClick={ onFilterHandler( option, onClose ) }>
							{ option.label }
						</MenuItem>
					) ) }
				</MenuGroup>
			) }
		</DropdownMenu>
	);
};

export default DropdownFilter;
