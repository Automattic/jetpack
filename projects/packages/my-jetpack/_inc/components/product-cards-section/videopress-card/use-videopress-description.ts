import { __ } from '@wordpress/i18n';
import preventWidows from '../../../utils/prevent-widows';

interface useVideoPressCardDescriptionProps {
	isPluginActive: boolean;
	videoCount: number;
}

const useVideoPressCardDescription = ( {
	isPluginActive,
	videoCount,
}: useVideoPressCardDescriptionProps ) => {
	if ( ! isPluginActive && videoCount ) {
		return preventWidows(
			__( 'Existing videos you could load faster without ads:', 'jetpack-my-jetpack' )
		);
	}

	if ( isPluginActive && ! videoCount ) {
		return preventWidows(
			__(
				'Stunning-quality, ad-free video in the WordPress Editor. Begin by uploading your first video.',
				'jetpack-my-jetpack'
			)
		);
	}

	return '';
};

export default useVideoPressCardDescription;
