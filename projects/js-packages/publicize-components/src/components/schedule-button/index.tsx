import { Dropdown, Button, DateTimePicker } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { getDate, date, isInTheFuture } from '@wordpress/date';
import { store as editorStore } from '@wordpress/editor';
import { useCallback, useState } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { calendar } from '@wordpress/icons';
import { useIsReSharingPossible } from '../../hooks/use-is-resharing-possible';
import { useSchedulePost } from '../../hooks/use-schedule-post';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import { store as socialStore } from '../../social-store';
import styles from './styles.module.scss';

interface ScheduleButtonBaseProps {
	scheduleTimestamp?: number;
	onConfirm?: ( unixTimestamp: number ) => void;
}

interface ScheduleButtonContentProps extends ScheduleButtonBaseProps {
	onClose: () => void;
	currentTimestamp: number;
	onTimestampChange: ( timestamp: number ) => void;
}

const isInvalidDate = ( checkDate: Date ) => {
	const tomorrow = new Date( checkDate );
	tomorrow.setDate( checkDate.getDate() + 1 );
	return ! isInTheFuture( tomorrow );
};

const ScheduleButtonContent = ( {
	onClose,
	currentTimestamp,
	onTimestampChange,
	onConfirm,
}: ScheduleButtonContentProps ) => {
	const confirmCallback = useCallback( () => {
		onConfirm?.( currentTimestamp );
		onClose();
	}, [ onClose, onConfirm, currentTimestamp ] );

	const changeCallback = useCallback(
		( newDate: string ) => {
			const unixTime = Math.floor( getDate( newDate ).getTime() / 1000 );
			onTimestampChange( unixTime );
		},
		[ onTimestampChange ]
	);

	const scheduleDate = date( 'Y-m-d\\TH:i:s', new Date( currentTimestamp * 1000 ), undefined );

	return (
		<>
			<DateTimePicker
				onChange={ changeCallback }
				currentDate={ scheduleDate }
				isInvalidDate={ isInvalidDate }
			/>
			<Button
				variant="primary"
				onClick={ confirmCallback }
				className={ styles.confirm }
				disabled={ ! isInTheFuture( scheduleDate ) }
			>
				{ _x(
					'Confirm',
					'Confirms the date and time selected to be used to share the post',
					'jetpack-publicize-components'
				) }
			</Button>
		</>
	);
};

const ScheduleButton = () => {
	const defaultTimestamp = Math.floor( Date.now() / 1000 );
	const [ currentTimestamp, setCurrentTimestamp ] = useState( defaultTimestamp );
	const isReSharingPossible = useIsReSharingPossible();
	const { enabledConnections } = useSocialMediaConnections();
	const { schedulePost } = useSchedulePost();
	const isSavingPost = useSelect( select => select( editorStore ).isSavingPost(), [] );

	const isSavingScheduledShare = useSelect(
		select => select( socialStore ).isSavingScheduledShare(),
		[]
	);
	const isBusy = isSavingScheduledShare || isSavingPost;

	const onConfirm = useCallback(
		async ( scheduleTimestamp: number ) => {
			await schedulePost( {
				connectionIds: enabledConnections.map( connection => Number( connection.connection_id ) ),
				timestamp: scheduleTimestamp,
			} );
		},
		[ schedulePost, enabledConnections ]
	);

	const toggle = useCallback(
		( { onToggle, isOpen } ) => (
			<Button
				onClick={ ! isBusy ? onToggle : null }
				aria-expanded={ isOpen }
				aria-live="polite"
				icon={ calendar }
				isSecondary
				isBusy={ isBusy }
				disabled={ ! isReSharingPossible }
			>
				{ __( 'Schedule', 'jetpack-publicize-components' ) }
			</Button>
		),
		[ isBusy, isReSharingPossible ]
	);

	const content = useCallback(
		( { onClose } ) => (
			<ScheduleButtonContent
				onClose={ onClose }
				currentTimestamp={ currentTimestamp }
				onTimestampChange={ setCurrentTimestamp }
				onConfirm={ onConfirm }
			/>
		),
		[ currentTimestamp, onConfirm ]
	);

	return (
		<Dropdown
			popoverProps={ { placement: 'bottom-start' } }
			renderToggle={ toggle }
			renderContent={ content }
		/>
	);
};

export default ScheduleButton;
