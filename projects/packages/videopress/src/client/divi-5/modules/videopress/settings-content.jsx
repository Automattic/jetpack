/**
 * Content settings panel for the Divi 5 VideoPress module.
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from 'react';

const { TextContainer, ToggleContainer } = window?.divi?.fieldLibrary ?? {};

const { AdminLabelGroup, BackgroundGroup, FieldContainer, GroupContainer } =
	window?.divi?.module ?? {};

/*
 * The player options that map to VideoPress embed URL parameters. The user-facing
 * toggle wins over the hardcoded defaults the legacy module shipped; the rendered
 * URL only includes the ones that differ from the player defaults (see utils.js).
 * `controls` defaults on (its default lives in module.json); the rest default off.
 */
const PLAYER_TOGGLES = [
	{
		attrName: 'autoplay',
		label: __( 'Autoplay', 'jetpack-videopress-pkg' ),
		description: __( 'Start playing the video automatically.', 'jetpack-videopress-pkg' ),
	},
	{
		attrName: 'loop',
		label: __( 'Loop', 'jetpack-videopress-pkg' ),
		description: __( 'Restart the video when it reaches the end.', 'jetpack-videopress-pkg' ),
	},
	{
		attrName: 'muted',
		label: __( 'Muted', 'jetpack-videopress-pkg' ),
		description: __( 'Start the video without sound.', 'jetpack-videopress-pkg' ),
	},
	{
		attrName: 'controls',
		label: __( 'Player Controls', 'jetpack-videopress-pkg' ),
		description: __( 'Show the playback controls.', 'jetpack-videopress-pkg' ),
	},
	{
		attrName: 'playsinline',
		label: __( 'Play Inline', 'jetpack-videopress-pkg' ),
		description: __(
			'Play the video inline on mobile instead of fullscreen.',
			'jetpack-videopress-pkg'
		),
	},
];

/**
 * Renders the content panel.
 *
 * @param {object} props                      - Panel props supplied by Divi.
 * @param {object} props.defaultSettingsAttrs - The module's default attributes.
 * @return {Element} The content settings.
 */
export const SettingsContent = ( { defaultSettingsAttrs } ) => (
	<Fragment>
		<GroupContainer id="mainContent" title={ __( 'Video', 'jetpack-videopress-pkg' ) }>
			<FieldContainer
				attrName="guid.innerContent"
				label={ __( 'URL or Video ID', 'jetpack-videopress-pkg' ) }
				description={ __( 'Paste a VideoPress URL or Video ID.', 'jetpack-videopress-pkg' ) }
				features={ {
					sticky: false,
				} }
			>
				<TextContainer />
			</FieldContainer>
		</GroupContainer>
		<GroupContainer id="playerOptions" title={ __( 'Player', 'jetpack-videopress-pkg' ) }>
			{ PLAYER_TOGGLES.map( ( { attrName, label, description } ) => (
				<FieldContainer
					key={ attrName }
					attrName={ `${ attrName }.innerContent` }
					label={ label }
					description={ description }
					features={ {
						sticky: false,
					} }
				>
					<ToggleContainer />
				</FieldContainer>
			) ) }
		</GroupContainer>
		<BackgroundGroup />
		<AdminLabelGroup defaultGroupAttr={ defaultSettingsAttrs?.module?.meta?.adminLabel ?? {} } />
	</Fragment>
);
