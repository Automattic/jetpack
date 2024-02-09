import React from 'react';
import styles from './device.module.scss';

type DeviceType = 'desktop' | 'phone';

interface DeviceIconProps {
	device: DeviceType;
}

const DeviceIcon: React.FC< DeviceIconProps > = ( { device } ) => {
	return (
		<div className={ styles.icon }>
			{ device === 'desktop' && (
				<svg
					className={ styles.desktop }
					width="20"
					height="12"
					viewBox="0 0 20 12"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M2.22217 2C2.22217 0.89543 3.1176 0 4.22217 0H15.7777C16.8823 0 17.7777 0.895431 17.7777 2V10H18.5C19.3284 10 20 10.6716 20 11.5H0C0 10.6716 0.671573 10 1.5 10H2.22217V2ZM4.22217 1.5H15.7777C16.0539 1.5 16.2777 1.72386 16.2777 2V9.61111H3.72217V2C3.72217 1.72386 3.94602 1.5 4.22217 1.5Z"
						fill="#646970"
					/>
				</svg>
			) }

			{ device === 'phone' && (
				<svg
					className={ styles.phone }
					width="10"
					height="16"
					viewBox="0 0 10 16"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path d="M6 12H4V13.5H6V12Z" fill="#646970" />
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M0 2C0 0.895431 0.895431 0 2 0H8C9.10457 0 10 0.895431 10 2V14C10 15.1046 9.10457 16 8 16H2C0.895431 16 0 15.1046 0 14V2ZM2 1.5H8C8.27614 1.5 8.5 1.72386 8.5 2V14C8.5 14.2761 8.27614 14.5 8 14.5H2C1.72386 14.5 1.5 14.2761 1.5 14V2C1.5 1.72386 1.72386 1.5 2 1.5Z"
						fill="#646970"
					/>
				</svg>
			) }
		</div>
	);
};

export default DeviceIcon;
