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
	withFocusOutside,
} from '@wordpress/components';
import { check, people } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { RichText } from '@wordpress/block-editor';
import { create, getTextContent } from '@wordpress/rich-text';
import {
	useMemo,
	useState,
	useEffect,
	Component,
	useReducer,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getParticipantByLabel } from '../../conversation/utils';

const EDIT_MODE_ADDING = 'is-adding';
const EDIT_MODE_SELECTING = 'is-selecting';
const EDIT_MODE_EDITING = 'is-editing';

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

const speakersControlReducer = state => state + 1;

const DetectOutside = withFocusOutside(
	class extends Component {
		handleFocusOutside( event ) {
			this.props.onFocusOutside( event );
		}

		render() {
			return (
				<div className={ this.props.className }>
					{ this.props.children }
				</div>
			);
		}
	}
);

/**
 * Participants Autocompleter.
 *
 * @param {Array} participants - Conversation participants list.
 * @returns {object} Participants autocompleter.
 */
function refreshAutocompleter( participants ) {
	return {
		name: 'jetpack/conversation-participants',
		triggerPrefix: '',
		options: participants,

		getOptionLabel: ( { label } ) => (
			<span>{ label }</span>
		),

		getOptionKeywords: ( { label } ) => [ label ],

		getOptionCompletion: ( option ) => ( {
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
	const [ editingMode, setEditingMode ] = useState( participant ? EDIT_MODE_SELECTING : EDIT_MODE_ADDING );

	// we use a reducer to force re-rendering the SpeakerEditControl,
	// passing the `reRenderingKey` as property of the component.
	// It's required when we want to update the options in the autocomplete,
	// or when we need to hide it.
	const [ reRenderingKey, triggerRefreshAutocomplete ] = useReducer( speakersControlReducer, 0 );

	function onActionHandler() {
		switch ( editingMode ) {
			case EDIT_MODE_ADDING: {
				triggerRefreshAutocomplete();
				return onAdd( getTextContent( create( { html: label } ) ) );
			}

			case EDIT_MODE_EDITING: {
				return onUpdate( {
					...participant,
					label,
				} );
			}
		}
	}

	/**
	 * Funcion handler when user types participant label.
	 * It can edit a new participant, or add a new one,
	 * dependeing on the previous values.
	 *
	 * @param {string} newLabel - New participant label.
	 * @returns {null} Null
	 */
	function onChangeHandler( newLabel ) {
		// If the new label is empty,
		// activate autocomplete, and emit onClean(),
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
		if ( editingMode !== EDIT_MODE_ADDING ) {
			return [];
		}

		return [ refreshAutocompleter( participants ) ];
	}, [ participants, editingMode ] );

	useEffect( () => {
		setEditingMode( participant ? EDIT_MODE_SELECTING : EDIT_MODE_ADDING );
	}, [ participant ] );

	return (
		<DetectOutside
			className={ classNames( className, {
				'has-bold-style': label?.length,
				'is-adding-participant': editingMode === EDIT_MODE_ADDING,
				'is-editing-participant': editingMode === EDIT_MODE_EDITING,
				'is-selecting-participant': editingMode === EDIT_MODE_SELECTING,
			} ) }
			onFocusOutside={ onActionHandler }
		>
			<RichText
				key={ `re-render-key${ reRenderingKey }` }
				tagName="div"
				value={ label }
				formattingControls={ [] }
				withoutInteractiveFormatting={ true }
				onChange={ onChangeHandler }
				placeholder={ __( 'Speaker', 'jetpack' ) }
				keepPlaceholderOnFocus={ true }
				onSplit={ () => {} }
				onReplace={ ( replaceValue ) => {
					setTimeout( () => transcriptRef?.current?.focus(), 10 );

					const replacedParticipant = replaceValue?.[ 0 ];
					// Handling participant selection,
					// by picking them from the autocomplete options.
					if ( replacedParticipant ) {
						const { label: newLabel } = replacedParticipant;
						onParticipantChange( newLabel );
						setEditingMode( EDIT_MODE_SELECTING );
						return onSelect( replacedParticipant );
					}

					if ( ! label?.length ) {
						return;
					}

					const currentParticipantExists = getParticipantByLabel( participants, label );

					// Update speaker label.
					if ( participant && participant.label !== label ) {
						if ( currentParticipantExists ) {
							return onSelect( currentParticipantExists, true );
						}

						setEditingMode( EDIT_MODE_EDITING );
						return onActionHandler( {
							...participant,
							label,
						} );
					}

					// Select the speaker but from the current label value.
					if ( currentParticipantExists ) {
						setEditingMode( EDIT_MODE_SELECTING );
						return onSelect( currentParticipantExists, true );
					}

					// Add a new speaker.
					onActionHandler( true );
					return setEditingMode( EDIT_MODE_ADDING );
				} }
				autocompleters={ autocompleter }
			/>
		</DetectOutside>
	);
}
