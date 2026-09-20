import { RadioControl, TextControl } from '@wordpress/components';
import { __, _x, sprintf } from '@wordpress/i18n';
import { Button, Dialog, Text } from '@wordpress/ui';
import { useState } from 'react';

export type SaveMode = 'update' | 'copy';

type Props = {
	title: string;
	isBusy: boolean;
	onSave: ( mode: SaveMode, title: string ) => void;
	onCancel: () => void;
};

/**
 * Choose whether edited video replaces the current video or becomes a separate library item.
 *
 * @param props          - Component props.
 * @param props.title    - Source video title.
 * @param props.isBusy   - Whether a save request is in progress.
 * @param props.onSave   - Save the selected destination and title.
 * @param props.onCancel - Close without saving.
 * @return The save destination dialog.
 */
export default function SaveVideoDialog( { title, isBusy, onSave, onCancel }: Props ) {
	const [ mode, setMode ] = useState< SaveMode >( 'update' );
	const [ copyTitle, setCopyTitle ] = useState< string >( () =>
		// translators: %s: original video title.
		sprintf( __( '%s (edited)', 'jetpack-videopress-pkg' ), title )
	);
	return (
		<Dialog.Root
			open
			onOpenChange={ open => {
				if ( ! open && ! isBusy ) {
					onCancel();
				}
			} }
		>
			<Dialog.Popup size="small">
				<Dialog.Header>
					<Dialog.Title>{ __( 'Save video edits', 'jetpack-videopress-pkg' ) }</Dialog.Title>
					{ ! isBusy && <Dialog.CloseIcon label={ __( 'Close', 'jetpack-videopress-pkg' ) } /> }
				</Dialog.Header>
				<Dialog.Content>
					<div className="vp-video-editor__save-options">
						<RadioControl
							label={ __( 'Save as', 'jetpack-videopress-pkg' ) }
							selected={ mode }
							disabled={ isBusy }
							onChange={ value => setMode( value as SaveMode ) }
							options={ [
								{ value: 'update', label: __( 'Update existing video', 'jetpack-videopress-pkg' ) },
								{ value: 'copy', label: __( 'Save as new video', 'jetpack-videopress-pkg' ) },
							] }
						/>
						{ mode === 'copy' ? (
							<>
								<TextControl
									label={ __( 'New video title', 'jetpack-videopress-pkg' ) }
									value={ copyTitle }
									onChange={ setCopyTitle }
									disabled={ isBusy }
									__nextHasNoMarginBottom
									__next40pxDefaultSize
								/>
								<Text>
									{ __(
										'Add the edited version to your library. The current video stays unchanged.',
										'jetpack-videopress-pkg'
									) }
								</Text>
							</>
						) : (
							<Text>
								{ __(
									'Viewers will see the edited video. Your original is kept and can be restored. Existing chapters may need to be adjusted after the video finishes processing.',
									'jetpack-videopress-pkg'
								) }
							</Text>
						) }
					</div>
				</Dialog.Content>
				<Dialog.Footer>
					<Button variant="outline" disabled={ isBusy } onClick={ onCancel }>
						{ __( 'Cancel', 'jetpack-videopress-pkg' ) }
					</Button>
					<Button
						disabled={ isBusy || ( mode === 'copy' && ! copyTitle.trim() ) }
						onClick={ () => onSave( mode, copyTitle.trim() ) }
					>
						{ mode === 'copy'
							? _x( 'Save as new video', 'save edited video action', 'jetpack-videopress-pkg' )
							: __( 'Update video', 'jetpack-videopress-pkg' ) }
					</Button>
				</Dialog.Footer>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
