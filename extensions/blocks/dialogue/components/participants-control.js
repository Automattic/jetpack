/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	TextControl,
	BaseControl,
	SelectControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

function ParticipantsMenu( { participants, className, onSelect } ) {
	return (
		<MenuGroup className={ `${ className }__participants-selector` }>
			{ map( participants, ( { participant: newParticipant, participantSlug: newParticipantSlug } ) => (
				<MenuItem
					key={ newParticipantSlug }
					onClick={ () => onSelect( { newParticipant, newParticipantSlug } ) }
				>
					{ newParticipant }
				</MenuItem>
			) ) }
		</MenuGroup>
	);
}

function ParticipantControl( { className, participant, onChange } ) {
	return (
		<BaseControl className={ `${ className }__custom-participant` }>
			<div className={ `${ className }__text-button-container` }>
				<TextControl
					label={ __( 'Custom', 'jetpack' ) }
					value={ participant }
					onChange={ onChange }
				/>
			</div>
		</BaseControl>
	);
}

function ParticipantsSelector( {
	className,
	participants,
	participant,
	onSelect,
	onChange,
} ) {
		return (
			<Fragment>
				<ParticipantsMenu
					participants={ participants }
					participant={ participant }
					className={ className }
					onSelect={ onSelect }
				/>

				<ParticipantControl
					className={ className }
					participant={ participant }
					onChange={ ( newParticipant ) => onChange( { newParticipant, newParticipantSlug: null } ) }
				/>
			</Fragment>
		);
}

export function ParticipantsControl( {
	participants,
	currentParticipant,
	onSelect,
} ) {
		return (
			<SelectControl
				label={ __( 'Participant name', 'jetpack' ) }
				value={ currentParticipant }
				options={ map( participants, ( { participantSlug: value, participant: label } ) => ( { label, value } ) ) }
				onChange={ ( participantSlug ) => onSelect( { participantSlug } ) }
			/>
		);
}

export default function ParticipantsDropdown( props ) {
	const {
		label,
		position = { position: 'bottom' },
	} = props;

	return (
		<DropdownMenu
			popoverProps={ position }
			toggleProps={ {
				children: <span>{ label }</span>,
			} }
			icon="microphone"
		>
			{ () => <ParticipantsSelector { ...props } /> }
		</DropdownMenu>
	);
}
