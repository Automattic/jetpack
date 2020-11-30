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

export function SpeakersDropdown ( {
	id,
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
					<MenuGroup className={ `${ className }__speakers-selector` }>
						{ map( speakers, ( { speaker: newSpeaker, speakerSlug: newSpeakerSlug }, ind ) => (
							<MenuItem
								key={ newSpeakerSlug }
								onClick={ () => onSelect( { newSpeaker, newSpeakerSlug } ) }
								isSelected={ newSpeaker === speaker }
							>
								<TextControl
									label= { `Speaker ${ ind + 1 }` }
									id={ `${ newSpeakerSlug }-control-${ ind }` }
									value={ newSpeaker }
									onChange={ ( editSpeaker ) => onChange( {
										editSpeaker,
										editSpeakerSlug: newSpeakerSlug,
									} ) }
								/>
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
