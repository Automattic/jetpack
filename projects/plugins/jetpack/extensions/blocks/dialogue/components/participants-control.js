/**
 * WordPress dependencies
 */
import {
	Button,
	DropdownMenu,
	MenuGroup,
	SelectControl,
	TextControl,
	RadioControl,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { ENTER } from '@wordpress/keycodes';

import { __ } from '@wordpress/i18n';

function ParticipantEditItem( { value, onChange, onSelect, onDelete, disabled } ) {
	const [ participant, setParticipant ] = useState( value );

	return (
		<>
			<TextControl
				value={ participant }
				onChange={ ( newValue ) => {
					setParticipant( newValue );
					onChange( newValue );
				} }
				onClick={ ev => ev.stopPropagation() }
				onKeyDown={ ( { keyCode } ) => {
					if ( keyCode === ENTER ) {
						onSelect();
					}
				} }
			/>

			<Button
				disabled={ disabled }
				icon="trash"
				onClick={ () => onDelete() }
			/>
		</>
	);
}

function ParticipantAddItem( { value, onAdd, className } ) {
	const [ participant, setParticipant ] = useState( value );

	return (
		<div className={ className }>
			<TextControl
				value={ participant }
				onChange={ ( newValue ) => {
					setParticipant( newValue );
				} }
				onClick={ ev => ev.stopPropagation() }
				onKeyDown={ ( { keyCode } ) => {
					if ( keyCode === ENTER ) {
						setParticipant( '' );
						onAdd( participant );
					}
				} }
			/>

			<Button
				icon="plus"
				onClick={ () => {
					setParticipant( '' );
					onAdd( participant );
				} }
			/>
		</div>
	);
}

function ParticipantsMenu( {
	participants,
	className,
	participantSlug,
	onParticipantSelect,
	onParticipantAdd,
	onParticipantChange,
	onParticipantDelete,
} ) {
	return (
		<MenuGroup className={ `${ className }__participants` }>
			<RadioControl
				className={ `${ className }__participants-selector` }
				options={ participants.map( ( { participantSlug: slug } ) => ( {
					value: slug,
				} ) ) }
				selected={ participantSlug }
				onChange={ ( slug ) => onParticipantSelect( { participantSlug: slug } ) }
			/>

			<div className={ `${ className }__participants-selector__container` }>
				{ participants.map( ( { participant, participantSlug: slug } ) => (
					<div
						className={ `${ className }__participants-selector__participant` }
						key={ slug }
					>
						<ParticipantEditItem
							disabled={ participants.length < 2 }
							value={ participant }
							onChange={ ( value ) => onParticipantChange( {
								participantSlug: slug,
								participant: value,
							} ) }
							onSelect={ () => onParticipantSelect( { participantSlug: slug } ) }
							onDelete={ () => onParticipantDelete( slug ) }
						/>
					</div>
				) ) }
				<ParticipantAddItem
					className={ `${ className }__participants-selector__participant` }
					onAdd={ onParticipantAdd }
				/>
			</div>
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
