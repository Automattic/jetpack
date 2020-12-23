/**
 * WordPress dependencies
 */
import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	TextControl,
	SelectControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

function ParticipantsMenu( { participants, className, onSelect } ) {
	return (
		<MenuGroup className={ `${ className }__participants-selector` }>
			{ participants.map( ( { participant, participantSlug } ) => (
				<MenuItem key={ participantSlug } onClick={ () => onSelect( { participantSlug } ) }>
					{ participant }
				</MenuItem>
			) ) }
		</MenuGroup>
	);
}

export function ParticipantControl( { className, participantValue, onChange } ) {
	return (
		<div className={ `${ className }__custom-participant` }>
			<div className={ `${ className }__text-button-container` }>
				<TextControl
					label={ __( 'Custom', 'jetpack' ) }
					value={ participantValue }
					onChange={ participant =>
						onChange( {
							participantSlug: null,
							participant,
						} )
					}
					onFocus={ ( { target } ) =>
						onChange( {
							participantSlug: null,
							participant: target?.value,
						} )
					}
				/>
			</div>
		</div>
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

function ParticipantsSelector( { className, participants, participant, onSelect, onChange } ) {
	return (
		<Fragment>
			<ParticipantsMenu
				className={ className }
				participants={ participants }
				onSelect={ onSelect }
			/>

			<ParticipantControl
				className={ className }
				participantValue={ participant }
				onChange={ onChange }
			/>
		</Fragment>
	);
}

export default function ParticipantsDropdown( props ) {
	const { participantLabel, position = 'bottom left', labelClassName, icon = null } = props;

	return (
		<DropdownMenu
			popoverProps={ {
				position,
			} }
			toggleProps={ {
				className: labelClassName,
				children: <span>{ participantLabel }</span>,
			} }
			icon={ icon }
		>
			{ () => <ParticipantsSelector { ...props } /> }
		</DropdownMenu>
	);
}
