import { Dropdown, Button, DateTimePicker } from '@wordpress/components';
import { date, getSettings } from '@wordpress/date';
import { useCallback } from '@wordpress/element';
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
}

interface ScheduleButtonProps extends ScheduleButtonBaseProps {
	isBusy?: boolean; // Defaults to false
}

const ScheduleButtonContent = ( {
	onClose,
	scheduleTimestamp,
	onChange,
	onConfirm,
}: ScheduleButtonContentProps ) => {
	const confirmCalback = useCallback( () => {
		onConfirm?.( scheduleTimestamp );
		onClose();
	}, [ onClose, onConfirm, scheduleTimestamp ] );

	const changeCallback = useCallback(
		( newDate: string ) => {
			const unixTime = +date( 'U', newDate + getSettings().timezone.abbr, 0 );
			onChange?.( unixTime );
		},
		[ onChange ]
	);

	const scheduleDate = date(
		'Y-m-d\\TH:i:s',
		scheduleTimestamp ? new Date( scheduleTimestamp * 1000 ) : new Date(),
		getSettings().timezone.offset
	);

	return (
		<>
			<DateTimePicker onChange={ changeCallback } currentDate={ scheduleDate } />
			<Button variant="primary" onClick={ confirmCalback } className={ styles.confirm }>
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
}: ScheduleButtonProps ) => {
	const toggle = useCallback(
		( { onToggle, isOpen } ) => (
			<Button
				onClick={ ! isBusy ? onToggle : null }
				aria-expanded={ isOpen }
				aria-live="polite"
				icon={ calendar }
				isSecondary
				isBusy={ isBusy }
			>
				{ __( 'Schedule', 'jetpack-publicize-components' ) }
			</Button>
		),
		[ isBusy ]
	);
	const content = useCallback(
		( { onClose } ) => (
			<ScheduleButtonContent
				onClose={ onClose }
				scheduleTimestamp={ scheduleTimestamp }
				onChange={ onChange }
				onConfirm={ onConfirm }
			/>
		),
		[ scheduleTimestamp, onChange, onConfirm ]
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
