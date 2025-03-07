import { Dropdown, Button, DateTimePicker } from '@wordpress/components';
import { date, getSettings } from '@wordpress/date';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { calendar } from '@wordpress/icons';
import styles from './styles.module.scss';

interface ScheduleButtonBaseProps {
	scheduleTimestamp?: number;
	onChange?: ( unixTimestamp: number ) => void;
	onConfirm?: () => void;
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
		onConfirm?.();
		onClose();
	}, [ onClose, onConfirm ] );

	const changeCallback = useCallback(
		newDate => {
			const unixTime = +date( 'U', newDate + getSettings().timezone.abbr, 0 );
			onChange?.( unixTime );
		},
		[ onChange ]
	);

	const scheduleDate = useMemo(
		() =>
			date(
				'Y-m-d\\TH:i:s',
				scheduleTimestamp ? new Date( scheduleTimestamp * 1000 ) : new Date(),
				getSettings().timezone.offset
			),
		[ scheduleTimestamp ]
	);

	return (
		<>
			<DateTimePicker onChange={ changeCallback } currentDate={ scheduleDate } />
			<Button variant="primary" onClick={ confirmCalback } className={ styles.confirm }>
				{ __( 'Confirm Schedule', 'jetpack-publicize-components' ) }
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
	return <Dropdown position="bottom left" renderToggle={ toggle } renderContent={ content } />;
};

export default ScheduleButton;
