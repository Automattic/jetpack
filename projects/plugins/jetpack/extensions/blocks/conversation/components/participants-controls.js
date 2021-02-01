/**
 * WordPress dependencies
 */
import { DropdownMenu, TextControl, Button } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

function AddParticipantButton( { className, onAdd, participants = [] } ) {
	return (
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
	);
}

function ParticipantsLabelControl( { className, participants, onChange, onDelete } ) {
	return (
		<div className={ `${ className }__participant-control` }>
			{ participants.map( ( { label, slug } ) => (
				<div key={ `${ slug }-key` } className={ `${ className }__participant` }>
					<TextControl
						value={ label }
						onChange={ value =>
							onChange( {
								slug,
								label: value,
							} )
						}
					/>

					<Button
						disabled={ participants.length < 2 }
						className={ `${ className }__remove-participant` }
						label={ __( 'Remove participant', 'jetpack' ) }
						onClick={ () => onDelete( slug ) }
						isTertiary
						isSmall
					>
						{ _x( 'Remove', 'verb: remove item from a list', 'jetpack' ) }
					</Button>
				</div>
			) ) }
		</div>
	);
}

export function ParticipantsSelector( { participants, className, onChange, onDelete, onAdd } ) {
	return (
		<Fragment>
			<ParticipantsLabelControl
				className={ className }
				participants={ participants }
				onChange={ onChange }
				onDelete={ onDelete }
			/>

			<AddParticipantButton className={ className } onAdd={ onAdd } participants={ participants } />
		</Fragment>
	);
}

export default function ParticipantsDropdown( props ) {
	return (
		<DropdownMenu
			popoverProps={ { position: 'bottom' } }
			toggleProps={ {
				children: <span>{ props.label }</span>,
			} }
			icon={ null }
		>
			{ () => <ParticipantsSelector { ...props } /> }
		</DropdownMenu>
	);
}
