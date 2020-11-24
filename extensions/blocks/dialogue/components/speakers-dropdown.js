/**
 * External dependencies
 */
import { map, find } from 'lodash';
import classNames from 'classnames';

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
	slug,
	onSelect,
	onChange,
	position = { position: 'bottom' },
} ) {
	const speakerBySlug = find( speakers, ( speakerOption ) => speakerOption.speakerSlug === slug );
	const defaultSpeakerObject = slug && speakerBySlug ? speakerBySlug : speakers[ 0 ];

	const isCustomSpeaker = ! slug && speaker;
	const currentSpeaker = isCustomSpeaker ? speaker : defaultSpeakerObject.speaker;
	const currentSpeakerSlug = ! isCustomSpeaker ? ( slug || defaultSpeakerObject.speakerSlug ) : null;

	return (
		<DropdownMenu
			popoverProps={ position }
			className={ `${ className }__speaker-container` }
			toggleProps={ {
				className: classNames(
					`${ className }__speaker`,
					{
						[ `is-${ currentSpeakerSlug }-speaker` ]: !! currentSpeakerSlug,
						[ 'is-custom-speaker' ]: isCustomSpeaker,
					}
				),
				children: <span>{ currentSpeaker }</span>,
			} }
			icon={ null }
		>
			{ () => (
				<Fragment>
					<MenuGroup className={ `${ className }__speakers-selector` }>
						{ map( speakers, ( { speaker: newSpeaker, speakerSlug: newSpeakerSlug } ) => (
							<MenuItem
								key={ newSpeakerSlug }
								onClick={ () => onSelect( { newSpeaker, newSpeakerSlug } ) }
								isSelected={ true }
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
								onChange={ ( newSpeaker ) => onChange( { newSpeaker, newSpeakerSlug: null } ) }
							/>
						</div>
					</BaseControl>
				</Fragment>
			) }
		</DropdownMenu>
	);
}
