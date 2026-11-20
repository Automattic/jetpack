import { ToolbarButton } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import scissors from '../../../../../components/icons/scissors';
import TrimCutModal from '../../../../../components/trim-cut-modal/lazy';
import type { VideoControlProps } from '../../types';

type TrimCutControlProps = VideoControlProps & {
	onProcessed: () => void;
};

/**
 * Open the trim editor from the block toolbar.
 *
 * @param props             - Video block props.
 * @param props.attributes  - Video block attributes.
 * @param props.onProcessed - Reload the block preview after processing.
 * @return The toolbar control and its lazy modal.
 */
function TrimCutControlEnabled( { attributes, onProcessed }: TrimCutControlProps ) {
	const [ isOpen, setIsOpen ] = useState( false );
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
					onProcessed={ onProcessed }
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
export default function TrimCutControl( props: TrimCutControlProps ) {
	const enabled = window?.videoPressEditorState?.trimCutEnabled;
	return enabled === true || enabled === '1' ? <TrimCutControlEnabled { ...props } /> : null;
}
