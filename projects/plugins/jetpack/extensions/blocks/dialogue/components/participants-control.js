/**
 * WordPress dependencies
 */
import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	SelectControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

function ParticipantsMenu( { participants, className, onSelect, participantSlug } ) {
	return (
		<MenuGroup className={ `${ className }__participants-selector` }>
			{ participants.map( ( { participant, participantSlug: slug } ) => (
				<MenuItem
					key={ slug }
					onClick={ () => onSelect( { participantSlug: slug } ) }
					isSelected={ participantSlug === slug }
					icon={ participantSlug === slug ? 'yes' : null }
				>
					{ participant }
				</MenuItem>
			) ) }
		</MenuGroup>
	);
}

export function ParticipantsControl( { participants, participantSlug: slug, onSelect } ) {
	return (
		<SelectControl
			label={ __( 'Participant name', 'jetpack' ) }
			value={ slug }
			options={ participants.map( ( { participantSlug: value, participant: label } ) => ( {
				label,
				value,
			} ) ) }
			onChange={ participantSlug => onSelect( { participantSlug } ) }
		/>
	);
}

function ParticipantsSelector( {
	className,
	participants,
	onSelect,
	participantSlug,
} ) {
	return (
		<Fragment>
			<ParticipantsMenu
				className={ className }
				participants={ participants }
				onSelect={ onSelect }
				participantSlug={ participantSlug }
			/>
		</Fragment>
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
			{ () => <ParticipantsSelector { ...props } /> }
		</DropdownMenu>
	);
}
