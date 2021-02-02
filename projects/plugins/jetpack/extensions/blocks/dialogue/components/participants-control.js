/**
 * WordPress dependencies
 */
import { DropdownMenu, MenuGroup, MenuItem, SelectControl } from '@wordpress/components';
import { check, people } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { RichText } from '@wordpress/block-editor';
import { useMemo, useState } from '@wordpress/element';
import {
	__experimentalUseFocusOutside as useFocusOutside,
} from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { getParticipantByLabel, getParticipantPlainText } from '../../conversation/utils';

// Fallback for `useFocusOutside` hook.
const useFocusOutsideWithFallback = typeof useFocusOutside !== 'undefined'
	? useFocusOutside
	: () => {};

function ParticipantsMenu( { participants, className, onSelect, participantSlug, onClose } ) {
	return (
		<MenuGroup className={ `${ className }__participants-selector` }>
			{ participants.map( ( { value, slug } ) => {
				// eslint-disable-next-line react/no-danger
				const optionValue = <span dangerouslySetInnerHTML={ {
					__html: value,
				} } />;

				return (
					<MenuItem
						key={ slug }
						onClick={ () => {
							onSelect( { participantSlug: slug } );
							onClose();
						} }
						isSelected={ participantSlug === slug }
						icon={ participantSlug === slug ? check : null }
					>
						{ optionValue }
					</MenuItem>
				);
			} ) }
		</MenuGroup>
	);
}

export function ParticipantsControl( { participants, participantSlug, onSelect } ) {
	return (
		<SelectControl
			label={ __( 'Participant name', 'jetpack' ) }
			value={ participantSlug }
			options={ participants.map( ( { slug: value, label } ) => ( {
				label,
				value,
			} ) ) }
			onChange={ slug => onSelect( { participantSlug: slug } ) }
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
		getOptionLabel: ( { value } ) => (
			// eslint-disable-next-line react/no-danger
			<span dangerouslySetInnerHTML={ {
				__html: value,
			} } />
		),

		getOptionKeywords: option => [ option.label ],

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
 * @param {string}   prop.value               - Dialogue participant value. Usually HTML. Local level.
 * @param {Array}    prop.participants        - Participants list. Global level (Conversation block).
 * @param {object}   prop.participant         - Participant object. Gloanl level.
 * @param {Function} prop.onParticipantChange - Use this callback to update participant, value locally.
 * @param {Function} prop.onUpdate            - Use this value to update the participant but globaly.
 * @param {Function} prop.onSelect            - Callback triggered when a particpant is selectd from the list.
 * @param {Function} prop.onAdd               - Callback used to add a new participant.
 * @param {Function} prop.onClean             - Use this callback to disassociate the Dialogue with a participant.
 * @returns {Function} React component function.
 */
export function ParticipantsRichControl( {
	value,
	participants,
	participant,
	onParticipantChange,
	onUpdate = () => {},
	onSelect,
	onAdd,
	onClean,
} ) {
	const [ addAutocomplete, setAddAutocomplete ] = useState( true );

	function addOrSelectParticipant() {
		// Before to update the participant,
		// Let's check the participant doesn't exist.
		const participantLabel = getParticipantPlainText( value );
		const existingParticipant = getParticipantByLabel( participants, participantLabel );
		if ( existingParticipant ) {
			setAddAutocomplete( false );
			return onSelect( existingParticipant );
		}

		onAdd( value );
	}

	/*
	 * Handle when on focus out.
	 * Add or Select a participant.
	 */
	function onFocusOutsideHandler() {
		// Clean current participant when content is empty.
		if ( ! value?.length ) {
			return;
		}

		addOrSelectParticipant();
	}

	const focusOutsideProps = useFocusOutsideWithFallback( onFocusOutsideHandler );

	/**
	 * Funcion handler when user types participant value.
	 * It can add a new participan, or add a new one,
	 * dependeing on the previous values.
	 *
	 * @param {string} newValue - New participant value.
	 * @returns {null} Null.
	 */
	function onChangeHandler( newValue ) {
		// Always update the participant value (block attribute).
		onParticipantChange( newValue );

		// Force hiding autocompleter when more than word.
		setAddAutocomplete( newValue.split( ' ' ).length === 1 );

		// If the new value is empty,
		// activate autocomplete, and emit on-clean
		// to clean the current participant.
		if ( ! newValue?.length ) {
			setAddAutocomplete( true );
			return onClean();
		}

		// if there is not a current participant,
		// there is not nothing to update.
		if ( ! participant ) {
			return;
		}

		onUpdate( {
			slug: participant.slug,
			label: getParticipantPlainText( newValue ), // <- store plain participant value.
			value: newValue,
		} );
	}

	const autocompleter = useMemo( () => {
		return [ refreshAutocompleter( participants ) ];
	}, [ participants ] );

	return (
		<div { ...focusOutsideProps }>
			<RichText
				tagName="div"
				value={ value }
				formattingControls={ [ 'bold', 'italic', 'text-color' ] }
				onChange={ onChangeHandler }
				placeholder={ __( 'Speaker', 'jetpack' ) }
				keepPlaceholderOnFocus={ true }
				onSplit={ () => {} }
				onReplace={ ( replaceValue ) => {
					const replacedParticipant = replaceValue?.[ 0 ];
					if ( ! replacedParticipant ) {
						// Here, it adds or selects participant.
						addOrSelectParticipant( value );
						return;
					}

					// It handleds replacing the block content
					// by selecting a participant from the autocomplete.
					const { value: newValue } = replacedParticipant;
					onParticipantChange( newValue );
					setAddAutocomplete( false );
					onSelect( replacedParticipant );
				} }
				autocompleters={ addAutocomplete ? autocompleter : [] }
			/>
		</div>
	);
}
