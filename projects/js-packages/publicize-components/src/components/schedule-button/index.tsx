import { Dropdown, Button, DateTimePicker } from '@wordpress/components';
import { getDate, date, isInTheFuture } from '@wordpress/date';
import { useCallback, useState } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { calendar } from '@wordpress/icons';
import styles from './styles.module.scss';

interface ScheduleButtonBaseProps {
	scheduleTimestamp?: number;
	onChange?: ( unixTimestamp: number ) => void;
	onConfirm?: ( unixTimestamp: number ) => void;
}

interface ScheduleButtonContentProps extends ScheduleButtonBaseProps {
	onClose: () => void;
	currentTimestamp: number;
	onTimestampChange: ( timestamp: number ) => void;
}

interface ScheduleButtonProps extends ScheduleButtonBaseProps {
	isBusy?: boolean; // Defaults to false
	isDisabled?: boolean;
}

const isInvalidDate = ( checkDate: Date ) => {
	const tomorrow = new Date( checkDate );
	tomorrow.setDate( checkDate.getDate() + 1 );
	// @ts-expect-error - This can be a string or Date, but it's defined as a string
	return ! isInTheFuture( tomorrow );
};

const ScheduleButtonContent = ( {
	onClose,
	currentTimestamp,
	onTimestampChange,
	onChange,
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
			onChange?.( unixTime );
		},
		[ onChange, onTimestampChange ]
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

const ScheduleButton = ( {
	scheduleTimestamp,
	onChange,
	onConfirm,
	isBusy,
	isDisabled,
}: ScheduleButtonProps ) => {
	const defaultTimestamp = scheduleTimestamp || Math.floor( Date.now() / 1000 );
	const [ currentTimestamp, setCurrentTimestamp ] = useState( defaultTimestamp );

	const toggle = useCallback(
		( { onToggle, isOpen } ) => (
			<Button
				onClick={ ! isBusy ? onToggle : null }
				aria-expanded={ isOpen }
				aria-live="polite"
				icon={ calendar }
				isSecondary
				isBusy={ isBusy }
				disabled={ isDisabled }
			>
				{ __( 'Schedule', 'jetpack-publicize-components' ) }
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
				onChange={ onChange }
				onConfirm={ onConfirm }
			/>
		),
		[ currentTimestamp, onChange, onConfirm ]
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
