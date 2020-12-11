/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	DropdownMenu,
	TextControl,
	BaseControl,
	Button,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

function AddParticipantButton( {
	className,
	onAdd,
	participants = [],
} ) {
	return (
		<BaseControl>
			<div className={ `${ className }__participant` }>
				<Button
					className={ `${ className }__add-button` }
					label={ __( 'Add Participant', 'jetpack' ) }
					onClick={ () => onAdd( `Participant ${ participants.length + 1 }` ) }
					isSecondary
					isSmall
				>
					{ __( 'Add participant', 'jetpack' ) }
				</Button>
			</div>
		</BaseControl>
	);
}

function ParticipantsLabelControl( {
	className,
	participants,
	onChange,
	onDelete,
} ) {
	return (
		<BaseControl className={ `${ className }__participant-control` }>
			{ map( participants, ( { participant, participantSlug } ) => (
				<div
					key={ `${ participantSlug }-key` }
					className={ `${ className }__participant` }
				>
					<TextControl
						value={ participant }
						onChange={ ( participantEditedValue ) => onChange( {
							participantSlug,
							participant: participantEditedValue,
						} ) }
					/>

					<Button
						label={ __( 'Delete', 'jetpack' ) }
						onClick={ () => onDelete( participantSlug ) }
						isTertiary
						isSmall
					>
						{ __( 'Remove', 'jetpack' ) }
					</Button>
				</div>
			) ) }
		</BaseControl>
	);
}

export function ParticipantsSelector( {
	participants,
	className,
	onChange,
	onDelete,
	onAdd,
} ) {
	return (
		<Fragment>
			<ParticipantsLabelControl
				className={ className }
				participants={ participants }
				onChange={ onChange }
				onDelete={ onDelete }
			/>

			<AddParticipantButton
				className={ className }
				onAdd={ onAdd }
				participants={ participants }
			/>
		</Fragment>
	);
}

export default function ParticipantsDropdown ( props ) {
	return (
		<DropdownMenu
			popoverProps={ { position: 'bottom' } }
			toggleProps={ {
				children: <span>{ props.label }</span>,
			} }
			icon="microphone"
		>
			{ () =>
				<ParticipantsSelector { ...props } />
			}
		</DropdownMenu>
	);
}
