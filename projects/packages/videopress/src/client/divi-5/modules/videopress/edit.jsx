/**
 * Visual Builder renderer for the Divi 5 VideoPress module.
 */
import { sprintf, __ } from '@wordpress/i18n';
import { moduleClassnames } from './module-classnames';
import { ModuleScriptData } from './module-script-data';
import { ModuleStyles } from './module-styles';
import { getVideoPressGuid, getEmbedUrl, getPlayerOptions } from './utils';

const { ModuleContainer } = window?.divi?.module ?? {};

/**
 * Renders the module preview inside the Visual Builder.
 *
 * @param {object} props          - Module render props supplied by Divi.
 * @param {object} props.attrs    - The module attributes.
 * @param {object} props.elements - The module element helpers.
 * @param {string} props.id       - The module id.
 * @param {string} props.name     - The module name.
 * @return {Element} The module container.
 */
export const VideoPressEdit = ( { attrs, elements, id, name } ) => {
	const guid = getVideoPressGuid( attrs?.guid?.innerContent?.desktop?.value );
	const playerOptions = getPlayerOptions( attrs );

	return (
		<ModuleContainer
			attrs={ attrs }
			elements={ elements }
			id={ id }
			name={ name }
			scriptDataComponent={ ModuleScriptData }
			stylesComponent={ ModuleStyles }
			classnamesFunction={ moduleClassnames }
		>
			{ elements.styleComponents( {
				attrName: 'module',
			} ) }
			{ guid ? (
				<div
					className="vidi-videopress-wrapper"
					style={ {
						position: 'relative',
						width: '100%',
						height: 0,
						paddingBottom: '56.25%',
					} }
				>
					<iframe
						title={ sprintf(
							/* translators: %s: Video GUID. */
							__( 'Video player for %s', 'jetpack-videopress-pkg' ),
							guid
						) }
						src={ getEmbedUrl( guid, playerOptions ) }
						style={ {
							position: 'absolute',
							top: 0,
							left: 0,
							width: '100%',
							height: '100%',
							border: 0,
						} }
						allowFullScreen
					/>
				</div>
			) : (
				<p>
					{ __(
						'Enter a VideoPress URL or Video ID to preview the video.',
						'jetpack-videopress-pkg'
					) }
				</p>
			) }
		</ModuleContainer>
	);
};
