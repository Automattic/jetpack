/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import styles from './style.module.scss';
import { ButtonGroup, Button, DropdownMenu } from '@wordpress/components';

const BackupIcon = () => (
	<svg width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path
			fill-rule="evenodd"
			clip-rule="evenodd"
			d="m15.82 11.373.013-1.277v-.03c0-1.48-1.352-2.899-3.3-2.899-1.627 0-2.87 1.014-3.205 2.207l-.32 1.143-1.186-.048a2.192 2.192 0 0 0-.089-.002c-1.19 0-2.233 1.008-2.233 2.35 0 1.34 1.04 2.348 2.23 2.35H16.8c.895 0 1.7-.762 1.7-1.8 0-.926-.649-1.643-1.423-1.776l-1.258-.218ZM7.883 8.97l-.15-.003C5.67 8.967 4 10.69 4 12.817c0 2.126 1.671 3.85 3.733 3.85H16.8c1.767 0 3.2-1.478 3.2-3.3 0-1.635-1.154-2.993-2.667-3.255v-.045c0-2.43-2.149-4.4-4.8-4.4-2.237 0-4.118 1.404-4.65 3.303Z"
			fill="#1E1E1E"
		/>
	</svg>
);

const DownIcon = () => (
	<svg width="15" height="9" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="10 9 4 7">
		<path
			fill-rule="evenodd"
			clip-rule="evenodd"
			d="m18.004 10.555-6.005 5.459-6.004-5.459 1.009-1.11 4.995 4.542 4.996-4.542 1.009 1.11Z"
			fill="#fff"
		/>
	</svg>
);

const ProductCard = () => {
	return (
		<div className={ styles.container }>
			<div className={ styles.name }>
				<span>Backup</span>
				<BackupIcon />
			</div>
			<p className={ styles.description }>Save every change</p>
			<div className={ styles.actions }>
				<ButtonGroup>
					<Button isPressed>Manage</Button>
					<DropdownMenu
						className={ styles.dropdown }
						toggleProps={ { isPressed: true } }
						popoverProps={ { noArrow: false } }
						icon={ DownIcon }
						controls={ [
							{
								title: 'Deactivate',
								icon: null,
							},
						] }
					/>
				</ButtonGroup>
				<div className={ styles.status }>Active</div>
			</div>
		</div>
	);
};

export default ProductCard;
