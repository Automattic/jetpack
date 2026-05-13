import MinifyLegacyNotice from '$features/minify-legacy-notice/minify-legacy-notice';
import MinifyMeta from '$features/minify-meta/minify-meta';
import Module from '$features/module/module';
import { useShowMinifyLegacy } from '$lib/stores/minify';
import { __ } from '@wordpress/i18n';

type MinifyJsProps = {
	inline?: boolean;
};

const MinifyJs = ( { inline = false }: MinifyJsProps = {} ) => {
	const showMinifyLegacy = useShowMinifyLegacy();

	return (
		<Module
			slug="minify_js"
			inline={ inline }
			title={ __( 'Concatenate JS', 'jetpack-boost' ) }
			description={ __(
				'Scripts are grouped by their original placement, concatenated and minified to reduce site loading time and reduce the number of requests.',
				'jetpack-boost'
			) }
			onEnable={ showMinifyLegacy.refetch }
		>
			<MinifyMeta
				datasyncKey="minify_js_excludes"
				buttonText={ __( 'Exclude JS handles', 'jetpack-boost' ) }
				placeholder={ __( 'Comma-separated list of JS handles to exclude', 'jetpack-boost' ) }
			/>
			{ showMinifyLegacy?.data && <MinifyLegacyNotice /> }
		</Module>
	);
};

export default MinifyJs;
