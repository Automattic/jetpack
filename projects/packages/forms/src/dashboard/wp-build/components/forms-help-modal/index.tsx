/**
 * WordPress dependencies
 */
import {
	Button,
	Modal,
	__experimentalText as Text, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

type Props = {
	isOpen: boolean;
	onClose: () => void;
};

/**
 * Help modal explaining why some forms don't appear in the Forms list.
 *
 * This is intended for the wp-build "Forms" screen, where the list shows managed forms only.
 *
 * @param props         - Component props.
 * @param props.isOpen  - Whether the modal is open.
 * @param props.onClose - Close handler.
 * @return The modal element, or null when closed.
 */
export default function FormsHelpModal( { isOpen, onClose }: Props ) {
	if ( ! isOpen ) {
		return null;
	}

	return (
		<Modal title={ __( 'Not seeing all your forms?', 'jetpack-forms' ) } onRequestClose={ onClose }>
			<VStack spacing="4">
				<Text>
					{ __( 'The Forms list shows reusable forms, not simple form blocks.', 'jetpack-forms' ) }
				</Text>
				<div>
					<Text as="p" weight="500">
						{ __( 'To convert a form block to a reusable form:', 'jetpack-forms' ) }
					</Text>
					<ol>
						<li>
							{ __( 'Open the page or post where your form block is embedded.', 'jetpack-forms' ) }
						</li>
						<li>{ __( 'Select the form block.', 'jetpack-forms' ) }</li>
						<li>
							{ __( 'Click “Edit Form” in the block toolbar to convert it.', 'jetpack-forms' ) }
						</li>
						<li>{ __( 'Save the page or post.', 'jetpack-forms' ) }</li>
					</ol>
				</div>
				<div>
					<Button variant="primary" onClick={ onClose }>
						{ __( 'Got it', 'jetpack-forms' ) }
					</Button>
				</div>
			</VStack>
		</Modal>
	);
}
