import { ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import styles from './image-cdn-liar.module.scss';
import { useModuleSurface } from '$features/module/surface';
import ModuleSubsection from '$features/ui/module-subsection/module-subsection';
import { recordBoostEvent } from '$lib/utils/analytics';
import { useMutationNotice } from '$features/ui/mutation-notice/mutation-notice';
import { useModulesState } from '$features/module/lib/stores';

type ImageCdnLiarProps = {
	isPremium: boolean;
};

export default function ImageCdnLiar( { isPremium }: ImageCdnLiarProps ) {
	const surface = useModuleSurface();
	if ( ! isPremium ) {
		return;
	}

	const [ modulesState, setModulesState ] = useModulesState();

	const enabledMessage = __( 'Auto-resize enabled.', 'jetpack-boost' );
	const disabledMessage = __( 'Auto-resize disabled.', 'jetpack-boost' );

	const imageCdnLiar = modulesState.data?.image_cdn_liar.active;
	const setImageCdnLiar = ( value: boolean ) => {
		setModulesState.mutate( {
			...modulesState.data,
			image_cdn_liar: { active: value, available: true },
		} );
	};

	useMutationNotice( 'image-cdn-liar', setModulesState, {
		successMessage: imageCdnLiar ? enabledMessage : disabledMessage,
	} );

	const handleToggle = ( value: boolean ) => {
		setImageCdnLiar( value );

		recordBoostEvent( 'image_cdn_liar_toggle', { enabled: Number( value ) } );
	};

	if ( surface === 'row' ) {
		return (
			<div className={ styles.well }>
				<ToggleControl
					label={ __( 'Auto-Resize Lazy Images', 'jetpack-boost' ) }
					help={ __(
						'Automatically resize images that are lazily loaded to fit the exact dimensions they occupy on the page.',
						'jetpack-boost'
					) }
					checked={ imageCdnLiar }
					onChange={ handleToggle }
					__nextHasNoMarginBottom
				/>
			</div>
		);
	}

	return (
		<ModuleSubsection>
			<div className={ styles.wrapper }>
				<div className={ styles.title }>
					<h4>{ __( 'Auto-Resize Lazy Images', 'jetpack-boost' ) }</h4>
					<ToggleControl
						className={ styles[ 'toggle-control' ] }
						checked={ imageCdnLiar }
						onChange={ handleToggle }
						__nextHasNoMarginBottom={ true }
					/>
				</div>
			</div>
			<div className={ styles.description }>
				{ __(
					'Automatically resize images that are lazily loaded to fit the exact dimensions they occupy on the page.',
					'jetpack-boost'
				) }
			</div>
		</ModuleSubsection>
	);
}
