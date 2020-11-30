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
} from '@wordpress/components';

export default function SpeakersDropdown ( {
	speakers,
	label,
	onChange,
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
				map( speakers, ( { speaker: newSpeaker, speakerSlug: newSpeakerSlug }, ind ) => (
					<TextControl
						key={ newSpeakerSlug }
						label= { `Speaker ${ ind + 1 }` }
						value={ newSpeaker }
						onChange={ ( editSpeaker ) => onChange( {
							editSpeaker,
							editSpeakerSlug: newSpeakerSlug,
						} ) }
					/>
				) )
			) }
		</DropdownMenu>
	);
}
