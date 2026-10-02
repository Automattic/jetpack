/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { CheckboxControl } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { createInterpolateElement, useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Dialog, Stack, Text } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import { CONFIG_STORE } from '../../../../store/config/index.ts';

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
 * @param props.isOpen  - Whether the dialog is open.
 * @param props.onClose - Close handler.
 * @return The dialog element.
 */
export default function FormsHelpModal( { isOpen, onClose }: Props ) {
	const [ dontShowAgain, setDontShowAgain ] = useState( false );
	const { receiveConfigValue } = useDispatch( CONFIG_STORE );

	const handleClose = useCallback( () => {
		setDontShowAgain( false );
		onClose();
	}, [ onClose ] );

	const handleOpenChange = useCallback(
		( open: boolean ) => {
			if ( ! open ) {
				handleClose();
			}
		},
		[ handleClose ]
	);

	const handleSubmit = useCallback( () => {
		if ( dontShowAgain ) {
			receiveConfigValue( 'hasClassicForms', false );
			apiFetch( {
				path: '/wp/v2/feedback/dismiss-classic-forms-notice',
				method: 'POST',
			} );
		}
		handleClose();
	}, [ dontShowAgain, handleClose, receiveConfigValue ] );

	if ( ! isOpen ) {
		return null;
	}

	return (
		<Dialog.Root open onOpenChange={ handleOpenChange }>
			<Dialog.Popup size="medium">
				<Dialog.Header>
					<Dialog.Title>{ __( 'Some forms may not appear here', 'jetpack-forms' ) }</Dialog.Title>
					<Dialog.CloseIcon label={ __( 'Close', 'jetpack-forms' ) } />
				</Dialog.Header>
				<Dialog.Content>
					<Stack direction="column" gap="md">
						<Text>
							{ __(
								'Forms you already added to pages or posts will continue to work. To add them to this list:',
								'jetpack-forms'
							) }
						</Text>
						<ol>
							<li>{ __( 'Open the page or post', 'jetpack-forms' ) }</li>
							<li>{ __( 'Select the form', 'jetpack-forms' ) }</li>
							<li>
								{ createInterpolateElement(
									__( 'Click <strong>Edit form</strong> in the toolbar', 'jetpack-forms' ),
									{ strong: <strong /> }
								) }
							</li>
							<li>{ __( 'Save the page or post', 'jetpack-forms' ) }</li>
						</ol>
						<Text>{ __( 'You only need to do this once per form.', 'jetpack-forms' ) }</Text>
					</Stack>
				</Dialog.Content>
				<Stack
					render={ <Dialog.Footer /> }
					direction="row"
					justify="space-between"
					align="center"
					gap="md"
					wrap="wrap"
				>
					<CheckboxControl
						__nextHasNoMarginBottom
						label={ __( "Don't show this again", 'jetpack-forms' ) }
						checked={ dontShowAgain }
						onChange={ setDontShowAgain }
					/>
					<Button variant="solid" onClick={ handleSubmit }>
						{ __( 'Got it', 'jetpack-forms' ) }
					</Button>
				</Stack>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
