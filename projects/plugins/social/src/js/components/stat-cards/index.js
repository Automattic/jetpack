import { Text, Spinner } from '@automattic/jetpack-components';
import styles from './styles.module.scss';

const StatCard = ( { icon, label, value, link, loading = false } ) => (
	<div className={ styles.card }>
		{ icon && icon }
		<Text className={ styles.label }>{ link ? <a href={ link }>{ label }</a> : label }</Text>
		{ loading ? (
			<Spinner color="#000" size={ 24 } className={ styles.spinner } />
		) : (
			<Text className={ styles.value } variant="headline-small">
				{ value }
			</Text>
		) }
	</div>
);

const StatCards = ( { stats } ) => (
	<div className={ styles.cards }>
		{ stats.map( stat => (
			<StatCard { ...stat } key={ stat.label } />
		) ) }
	</div>
);

export default StatCards;
