import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export type AppProps = {
	onClose: VoidFunction;
	postId: number;
};

/**
 * Post list page app component.
 *
 * @param {AppProps} props - Component props.
 * @return Post list page app component.
 */
export function App( { onClose, postId }: AppProps ) {
	return (
		<Modal
			open
			onRequestClose={ onClose }
			title={ __( 'Share post', 'jetpack-publicize-components' ) }
		>
			Showing UI for post ID: { postId }
		</Modal>
	);
}
