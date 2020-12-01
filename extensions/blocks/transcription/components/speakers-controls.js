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

import { Fragment, useState } from '@wordpress/element';

export function AddSpeakerButton( {
	className,
	onAdd,
} ) {
	const [ value, setValue ] = useState();

	function addNewSpeakerHandler() {
		onAdd( value );
		setValue( '' );
	}

	return (
		<BaseControl>
			<div className={ `${ className }__speaker` }>
				<TextControl
					label={ __( 'Add a speaker', 'jetpack' ) }
					value={ value }
					onChange={ setValue }
					onKeyDown={ ( { key } ) => {
						if ( key !== 'Enter' ) {
							return;
						}

						addNewSpeakerHandler();
					} }
				/>

				<Button
					className={ `${ className }__add-button` }
					label={ __( 'Add', 'jetpack' ) }
					onClick={ addNewSpeakerHandler }
					isSecondary
					isSmall
				>
					{ __( 'Add', 'jetpack' ) }
				</Button>
			</div>
		</BaseControl>
	);
}

export function SpeakersLabelControl( {
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
							isSecondary
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

export default function SpeakersDropdown ( {
	speakers,
	label,
	className,
	onChange,
	onDelete,
	onAdd,
} ) {
	return (
		<DropdownMenu
			popoverProps={ { position: 'bottom' } }
			toggleProps={ {
				children: <span>{ label }</span>,
			} }
			icon="microphone"
		>
			{ () => (
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
					/>
				</Fragment>
			) }
		</DropdownMenu>
	);
}
