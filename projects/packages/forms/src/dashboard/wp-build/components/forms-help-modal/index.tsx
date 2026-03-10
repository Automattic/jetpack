/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	CheckboxControl,
	Modal,
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalText as Text, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { CONFIG_STORE } from '../../../../store/config/index.ts';
import CreateFormButton from '../../../components/create-form-button';

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
	const [ dontShowAgain, setDontShowAgain ] = useState( false );
	const { receiveConfigValue } = useDispatch( CONFIG_STORE );

	const handleClose = useCallback( () => {
		if ( dontShowAgain ) {
			receiveConfigValue( 'hasClassicForms', false );
			apiFetch( {
				path: '/wp/v2/feedback/dismiss-classic-forms-notice',
				method: 'POST',
			} );
		}
		onClose();
	}, [ dontShowAgain, onClose, receiveConfigValue ] );

	if ( ! isOpen ) {
		return null;
	}

	return (
		<Modal
			title={ __( 'Not seeing all your forms?', 'jetpack-forms' ) }
			onRequestClose={ handleClose }
		>
			<VStack spacing="4">
				<Text>
					{ __(
						'This page only lists forms created from the Forms dashboard. Forms added directly inside pages or posts with the form block won\u2019t appear here.',
						'jetpack-forms'
					) }
				</Text>
				<div>
					<Text as="p" weight="500">
						{ __( 'To bring an existing form here:', 'jetpack-forms' ) }
					</Text>
					<ol>
						<li>{ __( 'Open the page or post that contains your form.', 'jetpack-forms' ) }</li>
						<li>{ __( 'Select the form block.', 'jetpack-forms' ) }</li>
						<li>
							{ __(
								'Click "Edit Form" in the toolbar \u2014 this converts it to a managed form.',
								'jetpack-forms'
							) }
						</li>
						<li>{ __( 'Save the page or post.', 'jetpack-forms' ) }</li>
					</ol>
				</div>
				<Text variant="muted" size="12px">
					{ __(
						'Tip: New forms created from this dashboard are automatically listed here.',
						'jetpack-forms'
					) }
				</Text>
				<HStack justify="space-between" alignment="center">
					<CheckboxControl
						__nextHasNoMarginBottom
						label={ __( "Don't show this again", 'jetpack-forms' ) }
						checked={ dontShowAgain }
						onChange={ setDontShowAgain }
					/>
					<Button variant="primary" onClick={ onClose }>
						{ __( 'Got it', 'jetpack-forms' ) }
					</Button>
					<CreateFormButton
						label={ __( 'Create a new form', 'jetpack-forms' ) }
						showIcon={ false }
					/>
				</HStack>
			</VStack>
		</Modal>
	);
}
