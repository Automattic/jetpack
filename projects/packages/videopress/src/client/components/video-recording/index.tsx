import { Button, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { lazy, Suspense, useState } from 'react';
import RecordIcon from './record-icon';

const RecordingModal = lazy( () => import( /* webpackChunkName: "video-recording" */ './modal' ) );

type Props = {
	onRecorded: ( file: File ) => void;
	disabled?: boolean;
	size?: 'default' | 'compact';
	__next40pxDefaultSize?: boolean;
};

/**
 * Open a camera recording workspace from an upload surface.
 *
 * @param props                       - Standard-upload handoff and availability.
 * @param props.onRecorded            - Standard-upload handoff.
 * @param props.disabled              - Whether the upload surface is unavailable.
 * @param props.size                  - Button size; `compact` matches the 32px dashboard header actions.
 * @param props.__next40pxDefaultSize - Match the 40px default used by editor buttons.
 * @return Recording trigger and modal.
 */
export default function RecordVideoButton( {
	onRecorded,
	disabled = false,
	size = 'default',
	__next40pxDefaultSize = false,
}: Props ) {
	const [ open, setOpen ] = useState( false );
	return (
		<>
			<Button
				__next40pxDefaultSize={ __next40pxDefaultSize }
				size={ size }
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
