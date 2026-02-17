import { Dropdown, Button, DateTimePicker } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { getDate, date, isInTheFuture } from '@wordpress/date';
import { useCallback, useState } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { calendar } from '@wordpress/icons';
import { useIsReSharingPossible } from '../../hooks/use-is-resharing-possible';
import { useSchedulePost } from '../../hooks/use-schedule-post';
import { store as socialStore } from '../../social-store';
import styles from './styles.module.scss';

interface ScheduleButtonContentProps {
	onConfirm?: ( unixTimestamp: number ) => void;
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
					'jetpack-publicize-pkg'
				) }
			</Button>
		</>
	);
};

const ScheduleButton = () => {
	const defaultTimestamp = Math.floor( Date.now() / 1000 );
	const [ currentTimestamp, setCurrentTimestamp ] = useState( defaultTimestamp );
	const isReSharingPossible = useIsReSharingPossible();
	const schedulePost = useSchedulePost();
	const isSharingCurrentPost = useSelect( select => select( socialStore ).isSharingCurrentPost() );

	const isSchedulingShares = useSelect( select => select( socialStore ).isSchedulingShares(), [] );
	const isBusy = isSchedulingShares;
	const isDisabled = ! isReSharingPossible || isSharingCurrentPost;

	const onConfirm = useCallback(
		async ( scheduleTimestamp: number ) => {
			await schedulePost( {
				timestamp: scheduleTimestamp,
			} );
		},
		[ schedulePost ]
	);

	const toggle = useCallback(
		( { onToggle, isOpen } ) => (
			<Button
				onClick={ ! isBusy && ! isDisabled ? onToggle : null }
				aria-expanded={ isOpen }
				aria-live="polite"
				icon={ calendar }
				isSecondary
				isBusy={ isBusy }
				disabled={ isDisabled }
			>
				{ __( 'Schedule', 'jetpack-publicize-pkg' ) }
			</Button>
		),
		[ isBusy, isDisabled ]
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
