import { Button, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { lazy, Suspense, useState } from 'react';
import RecordIcon from './record-icon';

const RecordingModal = lazy( () => import( /* webpackChunkName: "video-recording" */ './modal' ) );

type Props = {
	onRecorded: ( file: File ) => void;
	disabled?: boolean;
};

/**
 * Open a camera recording workspace from an upload surface.
 *
 * @param props            - Standard-upload handoff and availability.
 * @param props.onRecorded - Standard-upload handoff.
 * @param props.disabled   - Whether the upload surface is unavailable.
 * @return Recording trigger and modal.
 */
export default function RecordVideoButton( { onRecorded, disabled = false }: Props ) {
	const [ open, setOpen ] = useState( false );
	return (
		<>
			<Button
				variant="secondary"
				icon={ <RecordIcon /> }
				disabled={ disabled }
				onClick={ () => setOpen( true ) }
			>
				{ __( 'Record a video', 'jetpack-videopress-pkg' ) }
			</Button>
			{ open && (
				<Suspense fallback={ <Spinner /> }>
					<RecordingModal
						onClose={ () => setOpen( false ) }
						onRecorded={ file => {
							onRecorded( file );
							setOpen( false );
						} }
					/>
				</Suspense>
			) }
		</>
	);
}
