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
			{ map( participants, ( { participant, participantSlug } ) => (
				<MenuItem
					key={ participantSlug }
					onClick={ () => onSelect( { participantSlug } ) }
				>
					{ participant }
				</MenuItem>
			) ) }
		</MenuGroup>
	);
}

function ParticipantControl( { className, participantValue, onChange } ) {
	return (
		<BaseControl className={ `${ className }__custom-participant` }>
			<div className={ `${ className }__text-button-container` }>
				<TextControl
					label={ __( 'Custom', 'jetpack' ) }
					value={ participantValue }
					onChange={ ( participant ) => onChange( {
						participantSlug: null,
						participant,
					} ) }
					onFocus={ ( { target } ) => onChange( {
						participantSlug: null,
						participant: target?.value,
					} ) }
				/>
			</div>
		</BaseControl>
	);
}

export function ParticipantsControl( {
	participants,
	currentParticipantSlug,
	onSelect,
} ) {
		return (
			<SelectControl
				label={ __( 'Participant name', 'jetpack' ) }
				value={ currentParticipantSlug }
				options={ map( participants, ( { participantSlug: value, participant: label } ) => ( { label, value } ) ) }
				onChange={ ( participantSlug ) => onSelect( { participantSlug } ) }
			/>
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
					className={ className }
					participants={ participants }
					participantValue={ participant }
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
	const {
		participantLabel,
		position = { position: 'bottom' },
		icon = null,
	} = props;

	return (
		<DropdownMenu
			popoverProps={ position }
			toggleProps={ {
				children: <span>{ participantLabel }</span>,
			} }
			icon={ icon }
		>
			{ () => <ParticipantsSelector { ...props } /> }
		</DropdownMenu>
	);
}
