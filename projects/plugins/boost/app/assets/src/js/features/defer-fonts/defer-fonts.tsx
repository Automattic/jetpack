import { __ } from '@wordpress/i18n';
import { useModuleSurface } from '$features/module/surface';
import Module from '$features/module/module';

const DeferFonts = () => {
	const legacyDescription = __(
		'Load your theme’s web fonts after the rest of the page, so text and images appear sooner. Visitors briefly see a system font on their first visit while your fonts download.',
		'jetpack-boost'
	);
	const modernDescription = __(
		'Loads web fonts after the main page content, showing a system font until they are ready.',
		'jetpack-boost'
	);
	const isModern = useModuleSurface() === 'row';

	return (
		<Module
			slug="defer_fonts"
			title={ __( 'Defer Web Fonts', 'jetpack-boost' ) }
			description={ <p>{ isModern ? modernDescription : legacyDescription }</p> }
		/>
	);
};

export default DeferFonts;
