/**
 * Content settings panel for the Divi 5 VideoPress module.
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from 'react';

const { TextContainer } = window?.divi?.fieldLibrary ?? {};

const { AdminLabelGroup, BackgroundGroup, FieldContainer, GroupContainer } =
	window?.divi?.module ?? {};

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
		<BackgroundGroup />
		<AdminLabelGroup defaultGroupAttr={ defaultSettingsAttrs?.module?.meta?.adminLabel ?? {} } />
	</Fragment>
);
