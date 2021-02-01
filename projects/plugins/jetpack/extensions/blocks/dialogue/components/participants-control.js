/**
 * WordPress dependencies
 */
import { DropdownMenu, MenuGroup, MenuItem, SelectControl } from '@wordpress/components';
import { check } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

function ParticipantsMenu( { participants, className, onSelect, participantSlug, onClose } ) {
	return (
		<MenuGroup className={ `${ className }__participants-selector` }>
			{ participants.map( ( { label, slug } ) => (
				<MenuItem
					key={ slug }
					onClick={ () => {
						onSelect( { participantSlug: slug } );
						onClose();
					} }
					isSelected={ participantSlug === slug }
					icon={ participantSlug === slug ? check : null }
				>
					{ label }
				</MenuItem>
			) ) }
		</MenuGroup>
	);
}

export function ParticipantsControl( { participants, participantSlug, onSelect } ) {
	return (
		<SelectControl
			label={ __( 'Participant name', 'jetpack' ) }
			value={ participantSlug }
			options={ participants.map( ( { slug: value, label } ) => ( {
				label,
				value,
			} ) ) }
			onChange={ slug => onSelect( { participantSlug: slug } ) }
		/>
	);
}

export default function ParticipantsDropdown( props ) {
	const { label, position = 'bottom', labelClassName, icon = null } = props;

	return (
		<DropdownMenu
			popoverProps={ {
				position,
			} }
			toggleProps={ {
				className: labelClassName,
				children: <span>{ label }</span>,
			} }
			icon={ icon }
		>
			{ ( { onClose } ) => <ParticipantsMenu { ...props } onClose={ onClose } /> }
		</DropdownMenu>
	);
}
