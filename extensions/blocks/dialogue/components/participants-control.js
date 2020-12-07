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

export default function ParticipantsDropdown( {
	className,
	participants,
	participant,
	label,
	onSelect,
	onChange,
	position = { position: 'bottom' },
} ) {
	return (
		<DropdownMenu
			popoverProps={ position }
			toggleProps={ {
				children: <span>{ label }</span>,
			} }
			icon="microphone"
		>
			{ () => (
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
			) }
		</DropdownMenu>
	);
}
