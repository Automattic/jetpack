/**
 * WordPress dependencies
 */
import {
	Button,
	DropdownMenu,
	MenuGroup,
	SelectControl,
	MenuItem,
} from '@wordpress/components';
import { create, getTextContent } from '@wordpress/rich-text';
import { check, people } from '@wordpress/icons';
import { useState, useMemo, useEffect } from '@wordpress/element';
import { ENTER } from '@wordpress/keycodes';
import { __ } from '@wordpress/i18n';
import { RichText } from '@wordpress/block-editor';
import {
	__experimentalUseFocusOutside as useFocusOutside,
} from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { getParticipantByValue } from '../../conversation/utils';
const participantNotDefinedLabel = __( 'Not defined', 'jetpack' );

function ParticipantEditItem( {
	value,
	onSelect,
	onDelete,
	disabled,
} ) {
	return (
		<>
			<Button
				className="add-participant"
				onClick={ onSelect }
			>
				{ value }
			</Button>

			<Button
				disabled={ disabled }
				icon="trash"
				onClick={ () => onDelete() }
			/>
		</>
	);
}

export function ParticipantsEditMenu( {
	participants,
	className,
	onParticipantSelect,
	onParticipantChange,
	onParticipantDelete,
	onClose = () => {},
} ) {
	return (
		<MenuGroup className={ `${ className }__participants` }>
			{ participants.map( ( { participantPlain, participantSlug: slug } ) => (
				<div
					className={ `${ className }__participants-selector__participant` }
					key={ slug }
				>
					<ParticipantEditItem
						disabled={ participants.length < 2 }
						value={ participantPlain }
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
		</MenuGroup>
	);
}

export function ParticipantsMenu( { participants, className, onSelect, participantSlug, onClose } ) {
	return (
		<MenuGroup className={ `${ className }__participants-selector` }>
			{ participants.map( ( { participantSlug: slug, participant } ) => (
				<MenuItem
					key={ slug }
					onClick={ () => {
						onSelect( {
							participant,
							participantSlug: slug,
						} );
						onClose();
					} }
					isSelected={ participantSlug === slug }
					icon={ participantSlug === slug ? check : null }
				>
					{
						// eslint-disable-next-line react/no-danger
						<span dangerouslySetInnerHTML={ {
							__html: participant
						} } /> || participantNotDefinedLabel
					}
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

function dropdownToggleProps( { label, className, onFocus } ) {
	if ( label === false ) {
		return {};
	}

	if ( label ) {
		return {
			className,
			children:
				<Button
					className={ className }
					onClick={ onFocus }
					onFocus={ onFocus }
				>
					{ label }
				</Button>
		};
	}

	return {
		className,
		children: <span>{ participantNotDefinedLabel }</span>,
	};
}

export function ParticipantsDropdown( props ) {
	const { labelClassName, onFocus, label } = props;
	const className = label?.length
		? labelClassName
		: 'wp-block-jetpack-dialogue__participant is-undefined';

	return (
		<ParticipantsEditDropdown
			{ ...props }
			toggleProps={ dropdownToggleProps( { label, className, onFocus } ) }
		/>
	);
}

function refreshAutocompleter( { options } ) {
	return {
		name: 'jetpack/conversation-participants',
		triggerPrefix: '',
		options,
		getOptionLabel: ( { html } ) => (
			// eslint-disable-next-line react/no-danger
			<span dangerouslySetInnerHTML={ {
				__html: html
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

export function ParticipantsEditControl( {
	participant,
	onParticipantChange,
	participants,
	currentParticipant,
	onSelect,
	onClean,
	onUpdate = () => {},
	onAdd,
	isSelected,
} ) {
	const [ addAutocomplete, setAddAutocomplete ] = useState( true );

	function onFocusOutsideHandler() {
		// Clean current participant when content is empty.
		if ( ! participant?.length ) {
			return;
		}

		if ( currentParticipant ) {
			return;
		}

		// Before to update the participant,
		// Let's check the participant doesn't exist.
		const participantPlain = getTextContent( create( { html: participant } ) );
		const participantExist = getParticipantByValue( participants, participantPlain );
		if ( participantExist ) {
			setAddAutocomplete( false );
			return onSelect( { slug: participantExist.participantSlug } );
		}

		onAdd( participant );
	}

	function onChangeHandler( newValue ) {
		onParticipantChange( newValue );
		if ( ! currentParticipant ) {
			return;
		}

		if ( ! newValue?.length ) {
			setAddAutocomplete( true );
			return onClean();
		}

		onUpdate( {
			slug: currentParticipant.participantSlug,
			value: newValue,
		} );
	}

	const focusOutsideProps = useFocusOutside( onFocusOutsideHandler );

	/*
	 * Update all other `Dialogue`s blocks
	 * with the new values,
	 * less this current one.
	 */
	useEffect( () => {
		if ( ! currentParticipant ) {
			return;
		}

		if ( isSelected ) {
			return;
		}

		onParticipantChange( currentParticipant?.participant );
	}, [ currentParticipant, isSelected, onParticipantChange ] );

	const autocompleters = useMemo( () => {
		const options = participants.map( ( {
			participant: participantValue,
			participantPlain,
			participantSlug: slug,
		} ) => ( {
			label: participantPlain,
			html: participantValue,
			slug,
		} ) );

		return [ refreshAutocompleter( { options } ) ];
	}, [ participants ] );

	return (
		<div { ...focusOutsideProps }>
			<RichText
				tagName="span"
				value={ participant }
				formattingControls={ [ 'bold', 'italic', 'text-color' ] }
				onChange={ onChangeHandler }
				placeholder={ __( 'Speaker', 'jetpack' ) }
				keepPlaceholderOnFocus={ true }
				onSplit={ () => {} }
				onReplace={ ( replaceValue ) => {
					// It handleds replacing the block content
					// by selecting a participant from the autocomplete.
					const replacedParticipant = replaceValue?.[ 0 ];
					if ( ! replacedParticipant ) {
						return;
					}

					const { html, slug } = replacedParticipant;
					onParticipantChange( html );
					setAddAutocomplete( false );
					onSelect( { slug } );
				} }
				autocompleters={ addAutocomplete ? autocompleters : [] }
			/>
		</div>
	);
}