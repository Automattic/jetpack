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

function AddSpeakerButton( {
	className,
	onAdd,
	speakers = [],
} ) {
	return (
		<BaseControl>
			<div className={ `${ className }__speaker` }>
				<Button
					className={ `${ className }__add-button` }
					label={ __( 'Add Participant', 'jetpack' ) }
					onClick={ () => onAdd( `Participant ${ speakers.length + 1 }` ) }
					isSecondary
					isSmall
				>
					{ __( 'Add participant', 'jetpack' ) }
				</Button>
			</div>
		</BaseControl>
	);
}

function SpeakersLabelControl( {
	className,
	speakers,
	onChange,
	onDelete,
} ) {
	return (
		<Fragment>
			{ map( speakers, ( { speaker, speakerSlug } ) => (
				<BaseControl className={ `${ className }__speaker-control` }>
					<div className={ `${ className }__speaker` }>
						<TextControl
							value={ speaker }
							onChange={ ( speakerEditedValue ) => onChange( {
								speakerSlug,
								speaker: speakerEditedValue,
							} ) }
						/>

						<Button
							label={ __( 'Delete', 'jetpack' ) }
							onClick={ () => onDelete( speakerSlug ) }
							isTertiary
							isSmall
						>
							{ __( 'Remove', 'jetpack' ) }
						</Button>
					</div>
				</BaseControl>
			) ) }
		</Fragment>
	);
}

export function SpeakersSelector( {
	speakers,
	className,
	onChange,
	onDelete,
	onAdd,
} ) {
	return (
		<Fragment>
			<SpeakersLabelControl
				className={ className }
				speakers={ speakers }
				onChange={ onChange }
				onDelete={ onDelete }
			/>

			<AddSpeakerButton
				className={ className }
				onAdd={ onAdd }
				speakers={ speakers }
			/>
		</Fragment>
	);
}

export default function SpeakersDropdown ( props ) {
	return (
		<DropdownMenu
			popoverProps={ { position: 'bottom' } }
			toggleProps={ {
				children: <span>{ props.label }</span>,
			} }
			icon="microphone"
		>
			{ () =>
				<SpeakersSelector { ...props } />
			}
		</DropdownMenu>
	);
}
