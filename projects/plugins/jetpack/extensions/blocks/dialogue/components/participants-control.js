/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	SelectControl,
	Dropdown,
	ComboboxControl
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { check, people } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { RichText } from '@wordpress/block-editor';

// import { __experimentalUseFocusOutside as useFocusOutside } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { getParticipantByLabel } from '../../conversation/utils';

// Fallback for `useFocusOutside` hook.
// const useFocusOutsideIsAvailable = typeof useFocusOutside !== 'undefined';
// const useFocusOutsideWithFallback = useFocusOutsideIsAvailable ? useFocusOutside : () => {};

const ENTER_KEY = 'Enter';
const ESCAPE_KEY = 'Escape';
// const TAB_KEY = 'Tab';

function ParticipantsMenu( { participants, className, onSelect, slug, onClose } ) {
	return (
		<MenuGroup className={ `${ className }__participants-selector` }>
			{ participants.map( ( { label, slug: speakerSlug } ) => {
				const optionLabel = (
					<span>{ label }</span>
				);

				return (
					<MenuItem
						key={ slug }
						onClick={ () => {
							onSelect( { slug: speakerSlug } );
							onClose();
						} }
						isSelected={ slug === speakerSlug }
						icon={ slug === speakerSlug ? check : null }
					>
						{ optionLabel }
					</MenuItem>
				);
			} ) }
		</MenuGroup>
	);
}

export function ParticipantsControl( { participants, slug, onSelect } ) {
	return (
		<SelectControl
			label={ __( 'Participant name', 'jetpack' ) }
			value={ slug }
			options={ participants.map( ( { slug: value, label } ) => ( {
				label,
				value,
			} ) ) }
			onChange={ participantSlug => onSelect( { slug: participantSlug } ) }
		/>
	);
}

export default function ParticipantsDropdown( props ) {
	return (
		<DropdownMenu
			popoverProps={ {
				position: 'bottom',
			} }
			icon={ people }
		>
			{ ( { onClose } ) => <ParticipantsMenu { ...props } onClose={ onClose } /> }
		</DropdownMenu>
	);
}

const SpeakerSelect = ( {
	className,
	value,
	onSelect,
	options,
	onCancel,
	onAdd,
} ) => {
	const [ newSpeakerLabel, setNewSpeakerLabel ] = useState( '' );
	const removeAssignmentSpeaker = {
		value: undefined,
		label: __( 'Remove speaker', 'jetpack' ),
	};

	return (
		// eslint-disable-next-line jsx-a11y/no-static-element-interactions
		<div
			className={ `${ className }__speaker-combobox-container` }
			tabIndex="-1"
			onKeyUp={ ( { key } ) => {
				if ( ! key ) {
					return;
				}

				if ( key === ESCAPE_KEY ) {
					return onCancel();
				}

				if ( key === ENTER_KEY ) {
					return onAdd( newSpeakerLabel );
				}
			} }
		>
			<ComboboxControl
				className={ `${ className }__speaker-combobox` }
				value={ value }
				options={
					value ? [ removeAssignmentSpeaker, ...options ] : options
				}
				onChange={ onSelect }
				onFilterValueChange={ setNewSpeakerLabel }
			/>
		</div>
	);
};

/**
 * Control to edit Dialogue participant globally.
 *
 * @param {object}   prop                     - ParticipantRichControl component.
 * @param {string}   prop.className           - Component CSS class.
 * @param {string}   prop.label               - Dialogue participant value. Local level.
 * @param {Array}    prop.participants        - Participants list. Global level (Conversation block).
 * @param {object}   prop.participant         - Participant object. Gloanl level.
 * @param {Function} prop.onParticipantChange - Use this callback to update participant label, locally.
 * @param {Function} prop.onUpdate            - Use this callback to update the participant, but globaly.
 * @param {Function} prop.onSelect            - Callback triggered when a particpant is selectd from the list.
 * @param {Function} prop.onAdd               - Callback used to add a new participant.
 * @param {Function} prop.onClean             - Use this callback to disassociate the Dialogue with a participant.
 * @param {Function} prop.onFocus             - onFocus callback RichText callback.
 * @returns {Function} React component function.
 */
export function SpeakerEditControl( {
	className,
	label,
	participants,
	participant,
	onParticipantChange,
	onUpdate = () => {},
	onSelect,
	onAdd,
	onClean,
	onFocus,
} ) {
	return (
		<div
			className={ classNames( className, {
				'has-bold-style': true,
			} ) }
		>
			<Dropdown
				className={ className }
				renderToggle={ ( { onToggle, isOpen } ) => {
					return (
						<RichText
							tagName="div"
							value={ label }
							formattingControls={ [] }
							withoutInteractiveFormatting={ false }
							onChange={ ( value ) => {
								onParticipantChange( value );

								if ( ! value?.length ) {
									if ( ! isOpen ) {
										onToggle();
									}
									return onClean();
								}
							} }
							placeholder={ __( 'Speaker', 'jetpack' ) }
							keepPlaceholderOnFocus={ true }
							onSplit={ () => {} }
							onReplace={ ( replaceValue ) => {
								const replacedParticipant = replaceValue?.[ 0 ];
								// Handling participant selection,
								// by picking them from the autocomplete options.
								if ( replacedParticipant ) {
									const { label: newLabel } = replacedParticipant;

									onParticipantChange( newLabel );
									// setEditingMode( EDIT_MODE_SELECTING );
									return onSelect( replacedParticipant );
								}

								if ( ! label?.length ) {
									return;
								}

								// Update speaker label.
								if ( participant && participant.label !== label ) {
									return onUpdate( {
										...participant,
										label,
									} );
								}

								const participantExists = getParticipantByLabel( participants, label );
								if ( participantExists ) {
									return onSelect( participantExists, true );
								}

								onAdd( label );
							} }
							onFocus={ onFocus }
						/>
					);
				} }
				renderContent={ ( { onClose } ) => {
					const speakerValue = {
						value: participant?.slug,
						label: participant?.label,
					};

					// Adjust options array.
					const options = participants.map( ( part ) => ( {
						value: part.slug,
						label: part.label,
					} ) );

					return (
						<SpeakerSelect
							className={ className }
							value={ speakerValue }
							options={ options }
							onSelect={ console.log }
							onCancel={ onClose }
							onAdd={ console.log }
						/>
					);
				} }
			/>
		</div>
	);
}
