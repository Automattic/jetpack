import { Modal } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useCallback, useState } from 'react';
import { useSchedulePost } from '../../hooks/use-schedule-post';
import { store as socialStore } from '../../social-store/index';
import { useShareMessageMaxLength } from '../../utils';
import { ConnectionList } from '../connection-list/list';
import MessageBoxControl from '../message-box-control';
import ScheduleButton from '../schedule-button';
import { SharePostButton } from '../share-post';

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
	const connections = useSelect( select => select( socialStore ).getConnections(), [] );

	const { toggleConnectionById } = useDispatch( socialStore );

	const toggleConnection = useCallback(
		( connectionId: string ) => {
			toggleConnectionById( connectionId, false );
		},
		[ toggleConnectionById ]
	);
	const [ message, setMessage ] = useState( '' );
	const maxCharacterLength = useShareMessageMaxLength();

	const { schedulePost } = useSchedulePost( postId );

	const { isSavingScheduledShare, enabledConnections } = useSelect(
		select => ( {
			isSavingScheduledShare: select( socialStore ).isSavingScheduledShare(),
			enabledConnections: select( socialStore ).getEnabledConnections(),
		} ),
		[]
	);

	const onSchedule = useCallback(
		async ( scheduleTimestamp: number ) => {
			await schedulePost( {
				connectionIds: enabledConnections.map( connection => Number( connection.connection_id ) ),
				timestamp: scheduleTimestamp,
			} );
		},
		[ schedulePost, enabledConnections ]
	);

	return (
		<Modal
			open
			onRequestClose={ onClose }
			title={ __( 'Share post', 'jetpack-publicize-components' ) }
			style={ { width: '100%', maxWidth: '512px' } }
		>
			<MessageBoxControl
				label={ __( 'Message', 'jetpack-publicize-components' ) }
				maxLength={ maxCharacterLength }
				onChange={ setMessage }
				message={ message }
				analyticsData={ { location: 'post-list-preview-modal' } }
			/>

			<div style={ { marginTop: '2rem' } }>
				<ConnectionList connections={ connections } onToggle={ toggleConnection } />
			</div>

			<div
				style={ { display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' } }
			>
				<ScheduleButton onConfirm={ onSchedule } isBusy={ isSavingScheduledShare } />
				<SharePostButton
					isDisabled={ isSavingScheduledShare }
					message={ message }
					postId={ postId }
					fetchStatusOnShare={ false }
				/>
			</div>
		</Modal>
	);
}
