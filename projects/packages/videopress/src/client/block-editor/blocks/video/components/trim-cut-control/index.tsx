import { ToolbarButton } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import scissors from '../../../../../components/icons/scissors';
import TrimCutModal from '../../../../../components/trim-cut-modal/lazy';
import { getVideoPressUrl } from '../../../../../lib/url';
import type { VideoControlProps } from '../../types';

/**
 * Open the trim editor from the block toolbar.
 *
 * @param props            - Video block props.
 * @param props.attributes - Video block attributes.
 * @return The toolbar control and its lazy modal.
 */
function TrimCutControlEnabled( { attributes }: VideoControlProps ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const { invalidateResolution } = useDispatch( coreStore );
	const { guid, id, title } = attributes;
	return (
		<>
			<ToolbarButton
				icon={ scissors }
				label={ __( 'Trim & cut', 'jetpack-videopress-pkg' ) }
				disabled={ ! guid || ! id }
				onClick={ () => setIsOpen( true ) }
			/>
			{ isOpen && guid && id && (
				<TrimCutModal
					guid={ guid }
					attachmentId={ id }
					title={ title }
					onClose={ () => setIsOpen( false ) }
					onProcessed={ () =>
						invalidateResolution( 'getEmbedPreview', [ getVideoPressUrl( guid, attributes ) ] )
					}
				/>
			) }
		</>
	);
}

/**
 * Gate the trim toolbar and its lazy modal on the localized feature flag.
 *
 * @param props - Video block props.
 * @return The enabled toolbar control, or null.
 */
export default function TrimCutControl( props: VideoControlProps ) {
	const enabled = window?.videoPressEditorState?.trimCutEnabled;
	return enabled === true || enabled === '1' ? <TrimCutControlEnabled { ...props } /> : null;
}
