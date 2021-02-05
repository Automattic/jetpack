/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { DropdownMenu, MenuGroup, MenuItem, SelectControl } from '@wordpress/components';
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

/**
 * Control to edit Dialogue participant globally.
 *
 * @param {object}   prop                     - ParticipantRichControl component.
 * @param {string}   prop.className           - Component CSS class.
 * @param {string}   prop.label               - Dialogue participant value. Local level.
 * @param {Array}    prop.participants        - Participants list. Global level (Conversation block).
 * @param {string}   prop.reRenderingKey      - Custom property to for a re-render in the rich text component.
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
	reRenderingKey,
	onParticipantChange,
	onUpdate = () => {},
	onSelect,
	onAdd,
	onClean,
	onFocus,
} ) {
	function onChangeHandler( newLabel ) {
		if ( ! newLabel?.length ) {
			return onClean();
		}

		onParticipantChange( newLabel );
	}

	return (
		<div
			className={ classNames( className, {
				'has-bold-style': true,
			} ) }
			// { ...focusOutsideProps }
		>
			<RichText
				key={ reRenderingKey }
				tagName="div"
				value={ label }
				formattingControls={ [] }
				withoutInteractiveFormatting={ false }
				onChange={ onChangeHandler }
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
				// autocompleters={ autocompleter }
				onFocus={ onFocus }
			/>
		</div>
	);
}
