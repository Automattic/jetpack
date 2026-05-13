import { ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useModulesState } from '$features/module/lib/stores';
import { useMutationNotice } from '$features/ui/mutation-notice/mutation-notice';
import { recordBoostEvent } from '$lib/utils/analytics';

type ImageCdnLiarProps = {
	isPremium: boolean;
};

export default function ImageCdnLiar( { isPremium }: ImageCdnLiarProps ) {
	const [ modulesState, setModulesState ] = useModulesState();

	const imageCdnLiar = !! modulesState.data?.image_cdn_liar.active;

	useMutationNotice( 'image-cdn-liar', setModulesState, {
		successMessage: imageCdnLiar
			? __( 'Auto-resize enabled.', 'jetpack-boost' )
			: __( 'Auto-resize disabled.', 'jetpack-boost' ),
	} );

	if ( ! isPremium ) {
		return null;
	}

	const handleToggle = ( value: boolean ) => {
		setModulesState.mutate( {
			...modulesState.data,
			image_cdn_liar: { active: value, available: true },
		} );
		recordBoostEvent( 'image_cdn_liar_toggle', { enabled: Number( value ) } );
	};

	return (
		<ToggleControl
			__nextHasNoMarginBottom
			label={ __( 'Auto-resize lazy images', 'jetpack-boost' ) }
			help={ __(
				'Automatically resize images that are lazily loaded to fit the exact dimensions they occupy on the page.',
				'jetpack-boost'
			) }
			checked={ imageCdnLiar }
			onChange={ handleToggle }
		/>
	);
}
