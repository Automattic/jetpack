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
	MenuItem,
} from '@wordpress/components';
import { check, people } from '@wordpress/icons';
import { useState, useEffect } from '@wordpress/element';
import { ENTER } from '@wordpress/keycodes';

import { __ } from '@wordpress/i18n';

function ParticipantEditItem( { value, onChange, onSelect, onDelete, onClose, disabled } ) {
	const [ participant, setParticipant ] = useState( value );
	useEffect( () => setParticipant( value ), [ value ] );

	return (
		<>
			<TextControl
				value={ participant }
				onChange={ ( newValue ) => {
					setParticipant( newValue );
					onChange( newValue );
				} }
				onKeyDown={ ( ev ) => {
					if ( ev.keyCode === ENTER ) {
						ev.preventDefault();
						onSelect();
						onClose();
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

function ParticipantAddItem( { onAdd, className } ) {
	const [ participant, setParticipant ] = useState( '' );

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
				disabled={ ! participant?.length }
				onClick={ () => {
					if ( ! participant?.length ) {
						return;
					}
					setParticipant( '' );
					onAdd( participant );
				} }
			/>
		</div>
	);
}

export function ParticipantsEditMenu( {
	participants,
	className,
	participantSlug,
	onParticipantSelect,
	onParticipantAdd,
	onParticipantChange,
	onParticipantDelete,
	onClose,
} ) {
	return (
		<MenuGroup className={ `${ className }__participants` }>
			<RadioControl
				className={ `${ className }__participants-selector` }
				options={ participants.map( ( { participantSlug: slug } ) => ( {
					value: slug,
				} ) ) }
				selected={ participantSlug }
				onChange={ ( slug ) => {
					onParticipantSelect( { participantSlug: slug } );
					onClose();
				} }
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
							onClose={ onClose }
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

export function ParticipantsMenu( { participants, className, onSelect, participantSlug, onClose } ) {
	return (
		<MenuGroup className={ `${ className }__participants-selector` }>
			{ participants.map( ( { participant, participantSlug: slug } ) => (
				<MenuItem
					key={ slug }
					onClick={ () => {
						onSelect( { participantSlug: slug } );
						onClose();
					} }
					isSelected={ participantSlug === slug }
					icon={ participantSlug === slug ? check : null }
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

function ParticipantsEditDropdown( props ) {
	const {
		editMode = true,
		icon = people,
		toggleProps = {},
	} = props;

	return (
		<DropdownMenu
			toggleProps={ toggleProps }
			icon={ icon }
		>
			{ editMode
				? ( { onClose } ) => <ParticipantsEditMenu { ...props } onClose={ onClose } />
				: ( { onClose } ) => <ParticipantsMenu { ...props } onClose={ onClose } />
			}
		</DropdownMenu>
	);
}

export function ParticipantsDropdown( props ) {
	const { labelClassName, onFocus, label } = props;
	const className = label?.length
		? labelClassName
		: 'wp-block-jetpack-dialogue__participant is-undefined';

	return (
		<ParticipantsEditDropdown
			{ ...props }
			toggleProps={ label
				? {
					className,
					children:
						<Button
							className={ className }
							onClick={ onFocus }
							onFocus={ onFocus }
						>
							{ label || __( 'Not defined', 'jetpack' ) }
						</Button>
				}
				: {}
			}
		/>
	);
}
