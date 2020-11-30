/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	DropdownMenu,
	MenuGroup,
	MenuItem,
	TextControl,
	BaseControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

function SpeakersMenu ( { speaker, speakers, className, onSelect, onChange } ) {
	return (
		<MenuGroup className={ `${ className }__speakers-selector` }>
			{ map( speakers, ( { speaker: newSpeaker, speakerSlug: newSpeakerSlug }, ind ) => (
				<MenuItem
					key={ newSpeakerSlug }
					onClick={ () => onSelect( { newSpeaker, newSpeakerSlug } ) }
					isSelected={ newSpeaker === speaker }
				>
					<TextControl
						label= { `Speaker ${ ind + 1 }` }
						value={ newSpeaker }
						onChange={ ( editSpeaker ) => onChange( {
							editSpeaker,
							editSpeakerSlug: newSpeakerSlug,
						} ) }
					/>
				</MenuItem>
			) ) }
		</MenuGroup>
	);
}

function SpeakerControl( { className, speaker, onChange } ) {
	return (
		<BaseControl className={ `${ className }__custom-speaker` }>
			<div className={ `${ className }__text-button-container` }>
				<TextControl
					label={ __( 'Custom speaker', 'jetpack' ) }
					value={ speaker }
					onChange={ onChange }
				/>
			</div>
		</BaseControl>
	);
}

export default function SpeakersDropdown ( {
	className,
	speakers,
	speaker,
	speakerName,
	onSelect,
	onChange,
	onCustomChange,
	position = { position: 'bottom' },
} ) {
	return (
		<DropdownMenu
			popoverProps={ position }
			toggleProps={ {
				children: <span>{ speakerName }</span>,
			} }
			icon="microphone"
		>
			{ () => (
				<Fragment>
					<SpeakersMenu
						speakers={ speakers }
						speaker={ speaker }
						className={ className }
						onSelect={ onSelect }
						onChange={ onChange }
					/>

					<SpeakerControl
						className={ className }
						speaker={ speaker }
						onChange={ ( newSpeaker ) => onCustomChange( { newSpeaker, newSpeakerSlug: null } ) }
					/>
				</Fragment>
			) }
		</DropdownMenu>
	);
}
