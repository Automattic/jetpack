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

function SpeakersMenu ( { speakers, className, onSelect } ) {
	return (
		<MenuGroup className={ `${ className }__speakers-selector` }>
			{ map( speakers, ( { speaker: newSpeaker, speakerSlug: newSpeakerSlug } ) => (
				<MenuItem
					key={ newSpeakerSlug }
					onClick={ () => onSelect( { newSpeaker, newSpeakerSlug } ) }
				>
					{ newSpeaker }
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
					label={ __( 'Custom', 'jetpack' ) }
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
	label,
	onSelect,
	onChange,
	position = { position: 'bottom' },
} ) {
	return (
		<DropdownMenu
			popoverProps={ position }
			toggleProps={ {
				children: <span>{ label }</span>,
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
					/>

					<SpeakerControl
						className={ className }
						speaker={ speaker }
						onChange={ ( newSpeaker ) => onChange( { newSpeaker, newSpeakerSlug: null } ) }
					/>
				</Fragment>
			) }
		</DropdownMenu>
	);
}
