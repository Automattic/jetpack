import { Container, Text } from '@automattic/jetpack-components';
import styles from './styles.module.scss';

const IconTextSection = ( { icon, title, children } ) => (
	<Container horizontalSpacing={ 7 } horizontalGap={ 3 }>
		<div className={ styles.column }>
			<div className={ styles.icon }>{ icon }</div>
			<Text className={ styles.title } variant="title-medium">
				{ title }
			</Text>
			<div className={ styles.text }>{ children }</div>
		</div>
	</Container>
);

export default IconTextSection;
