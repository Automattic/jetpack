import styles from './settings-item.module.scss';
import type { ReactNode } from 'react';

type SettingsItemProps = {
	title: ReactNode;
	description: ReactNode;
	children: ReactNode;
};

const SettingsItem = ( { title, description, children }: SettingsItemProps ) => {
	return (
		<div className={ styles.wrapper }>
			<div className={ styles.content }>
				<h3>{ title }</h3>

				<div className={ styles.description }>{ description }</div>

				{ children }
			</div>
		</div>
	);
};

export default SettingsItem;
