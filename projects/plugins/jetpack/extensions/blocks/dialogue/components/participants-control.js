import { RichText } from '@wordpress/block-editor';
import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	SelectControl,
	withFocusOutside,
} from '@wordpress/components';
import { useMemo, useState, Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { check, people } from '@wordpress/icons';
import classNames from 'classnames';
import {
	getParticipantByLabel,
	getParticipantBySlug,
	getPlainText,
} from '../../conversation/utils';

const EDIT_MODE_READY = 'is-participant-ready';
const EDIT_MODE_ADDING = 'is-participant-adding';
const EDIT_MODE_ADDED = 'was-participant-added';
const EDIT_MODE_SELECTING = 'is-participant-selecting';
const EDIT_MODE_SELECTED = 'was-participant-selected';
const EDIT_MODE_EDITING = 'is-participant-editing';
const EDIT_MODE_EDITED = 'was-participant-edited';

function ParticipantsMenu( { participants, className, onSelect, slug, onClose } ) {
	return (
		<MenuGroup className={ `${ className }__participants-selector` }>
			{ participants.map( ( { label, slug: speakerSlug } ) => {
				const optionLabel = <span>{ label }</span>;

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
			label={ __( 'Speaker name', 'jetpack' ) }
			value={ slug }
			options={ participants.map( ( { slug: value, label } ) => ( {
				label: getPlainText( label ),
				value,
			} ) ) }
			onChange={ participantSlug =>
				onSelect( getParticipantBySlug( participants, participantSlug ) )
			}
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

const DetectOutside = withFocusOutside(
	class extends Component {
		handleFocusOutside( event ) {
			this.props.onFocusOutside( event );
		}

		render() {
			return <div className={ this.props.className }>{ this.props.children }</div>;
		}
	}
);

/**
 * Participants Autocompleter.
 *
 * @param {Array} participants - Conversation participants list.
 * @returns {object} Participants autocompleter.
 */
function freshAutocompleter( participants ) {
	return {
		name: 'jetpack/conversation-participants',
		triggerPrefix: '',
		options: participants,

		getOptionLabel: ( { label } ) => <span>{ getPlainText( label ) }</span>,

		getOptionKeywords: ( { label } ) => [ label ],

		getOptionCompletion: option => ( {
			action: 'replace',
			value: option,
		} ),

		popoverProps: {
			position: 'bottom',
		},
	};
}

/**
 * Control to edit Dialogue participant globally.
 *
 * @param {object}   prop                     - ParticipantRichControl component.
 * @param {string}   prop.className           - Component CSS class.
 * @param {string}   prop.label               - Dialogue participant value. Local level.
 * @param {object}   prop.participant         - Participant object. Gloanl level.
 * @param {Array}    prop.participants        - Participants list. Global level (Conversation block).
 * @param {object}   prop.transcriptRef       - Reference to the transcript DOM element (DialogueEdit content).
 * @param {Function} prop.onParticipantChange - Use this callback to update participant label, locally.
 * @param {Function} prop.onUpdate            - Use this callback to update the participant, but globaly.
 * @param {Function} prop.onSelect            - Callback triggered when a particpant is selectd from the list.
 * @param {Function} prop.onAdd               - Callback used to add a new participant.
 * @param {Function} prop.onClean             - Use this callback to disassociate the Dialogue with a participant.
 * @returns {Function} React component function.
 */
export function SpeakerEditControl( {
	className,
	label,
	participant,
	participants,
	transcriptRef,
	onParticipantChange,
	onUpdate = () => {},
	onSelect,
	onAdd,
	onClean,
} ) {
	const [ editingMode, setEditingMode ] = useState( EDIT_MODE_READY );

	function editSpeakerHandler() {
		if ( ! label ) {
			return;
		}

		const participantExists = getParticipantByLabel( participants, label );

		if ( participant && participant.label !== label ) {
			// Check if the participant label exists, but it isn't the current one.
			if ( participantExists && participantExists.slug !== participant.slug ) {
				setEditingMode( EDIT_MODE_SELECTED );
				return onSelect( participantExists );
			}

			setEditingMode( EDIT_MODE_EDITED );
			return onUpdate( {
				...participant,
				label: getPlainText( label, true ),
			} );
		}

		// Select the speaker but from the current label value.
		if ( participantExists ) {
			setEditingMode( EDIT_MODE_SELECTED );
			return onSelect( participantExists );
		}

		// Add a new speaker.
		onAdd( getPlainText( label, true ) );
		return setEditingMode( EDIT_MODE_ADDED );
	}

	/**
	 * Funcion handler when user types participant label.
	 * It propagates the participant label value (local), and
	 * tracks the edition mode:
	 * - EDIT_MODE_ADDING
	 * - EDIT_MODE_SELECTING
	 * - EDIT_MODE_EDITING
	 *
	 * @param {string} newLabel - New participant label.
	 * @returns {null} Null
	 */
	function onChangeHandler( newLabel ) {
		// If the new label is empty emit onClean(),
		// to clean the current participant.
		if ( ! newLabel?.length ) {
			setEditingMode( EDIT_MODE_ADDING );
			return onClean();
		}

		// Always update the participant label (block attribute).
		onParticipantChange( newLabel );

		const participantByNewLabel = getParticipantByLabel( participants, newLabel );

		// Set editing mode depending on participant label,
		// and current conversation participant
		// tied to this Dialogue block.
		if ( participant ) {
			if ( participant.label === newLabel ) {
				setEditingMode( EDIT_MODE_SELECTING );
			} else {
				setEditingMode( EDIT_MODE_EDITING );
			}
		} else if ( participantByNewLabel ) {
			setEditingMode( EDIT_MODE_SELECTING );
		} else {
			setEditingMode( EDIT_MODE_ADDING );
		}
	}

	// Keep autocomplete options udated.
	const autocompleter = useMemo( () => {
		// No autocomplete when no edit mode defined.
		if ( ! editingMode ) {
			return [];
		}

		// SHow Autocomplete only when
		// adding a selecting a/the participant.
		if ( editingMode !== EDIT_MODE_ADDING && editingMode !== EDIT_MODE_SELECTING ) {
			return [];
		}

		return [ freshAutocompleter( participants ) ];
	}, [ participants, editingMode ] );

	return (
		<DetectOutside
			className={ classNames( className, {
				'has-bold-style': label?.length,
				[ editingMode ]: editingMode,
			} ) }
			onFocusOutside={ editSpeakerHandler }
		>
			<RichText
				tagName="div"
				value={ label }
				allowedFormats={ [] }
				withoutInteractiveFormatting={ true }
				onChange={ onChangeHandler }
				placeholder={ __( 'Speaker', 'jetpack' ) }
				onSplit={ () => {} }
				onReplace={ replaceValue => {
					setTimeout( () => transcriptRef?.current?.focus(), 10 );

					const replacedParticipant = replaceValue?.[ 0 ];
					// Handling participant selection,
					// by picking them from the autocomplete options.
					if ( replacedParticipant ) {
						const { label: newLabel } = replacedParticipant;
						onParticipantChange( newLabel );
						setEditingMode( EDIT_MODE_SELECTED );
						return onSelect( replacedParticipant );
					}

					return editSpeakerHandler();
				} }
				autocompleters={ autocompleter }
			/>
		</DetectOutside>
	);
}
