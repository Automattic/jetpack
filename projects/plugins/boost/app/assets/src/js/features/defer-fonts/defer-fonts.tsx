import { __ } from '@wordpress/i18n';
import Module from '$features/module/module';
import DeferFontsMeta from './defer-fonts-meta';

const DeferFonts = () => (
	<Module
		slug="defer_fonts"
		title={ __( 'Defer Web Fonts', 'jetpack-boost' ) }
		description={
			<p>
				{ __(
					'Loads web fonts after the main page content, showing a system font until they are ready.',
					'jetpack-boost'
				) }
			</p>
		}
	>
		<DeferFontsMeta />
	</Module>
);

export default DeferFonts;
