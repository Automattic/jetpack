import { Text, SocialIcon } from '@automattic/jetpack-components';
import { Icon, bug, calendar } from '@wordpress/icons';
import styles from './styles.module.scss';

const StatCard = ( { icon, label, value, link } ) => (
	<div className={ styles.card }>
		{ icon && icon }
		<Text className={ styles.label }>{ link ? <a href={ link }>{ label }</a> : label }</Text>
		<Text variant="headline-small">{ value }</Text>
	</div>
);

const StatCards = () => {
	const stats = [
		{
			icon: <SocialIcon size={ 24 } />,
			label: 'Total shares this month',
			value: '34',
		},
		{
			// TODO: Add proper icon
			icon: <Icon icon={ bug } size={ 24 } />,
			label: 'Total views from shares',
			value: '14K',
		},
		{
			icon: <Icon icon={ calendar } size={ 24 } />,
			label: 'Learn how to schedule shares',
			// TODO: Add proper link
			link: 'https://example.com',
		},
	];

	return (
		<div className={ styles.cards }>
			{ stats.map( stat => (
				<StatCard { ...stat } />
			) ) }
		</div>
	);
};

export default StatCards;
