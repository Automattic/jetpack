import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { chevronDown } from '@wordpress/icons';
import { first, map, noop } from 'lodash';

const DropdownFilter = ( { options = [], onFilter = noop } ) => {
	const firstOption = first( options );
	const [ dropdownLabel, setDropdownLabel ] = useState( firstOption?.label || '' );

	const onFilterHandler = useCallback(
		( data, onClose ) => () => {
			onFilter( data.value );
			setDropdownLabel( data.label );
			onClose();
		},
		[ onFilter ]
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
