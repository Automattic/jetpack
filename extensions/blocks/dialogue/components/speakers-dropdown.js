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

export default function SpeakersDropdown ( {
	id,
	className,
	speakers,
	speaker,
	speakerName,
	onSelect,
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
					<MenuGroup className={ `${ className }__speakers-selector` }>
						{ map( speakers, ( { speaker: newSpeaker, speakerSlug: newSpeakerSlug } ) => (
							<MenuItem
								key={ newSpeakerSlug }
								onClick={ () => onSelect( { newSpeaker, newSpeakerSlug } ) }
								isSelected={ newSpeaker === speaker }
							>
								{ newSpeaker }
							</MenuItem>
						) ) }
					</MenuGroup>

					<BaseControl
						id={ id }
						className={ `${ className }__custom-speaker` }
						label={ __( 'Custom', 'jetpack' ) }
					>
						<div className={ `${ className }__text-button-container` }>
							<TextControl
								id={ id }
								value={ speaker }
								onChange={ ( newSpeaker ) => onCustomChange( { newSpeaker, newSpeakerSlug: null } ) }
							/>
						</div>
					</BaseControl>
				</Fragment>
			) }
		</DropdownMenu>
	);
}
