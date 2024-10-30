import styles from './settings-item.module.scss';

type SettingsItemProps = {
	title: React.ReactNode;
	description: React.ReactNode;
	children: React.ReactNode;
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
