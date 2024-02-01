import FormToggle from '..';
import styles from './styles.module.scss';

const CompactFormToggle = props => (
	<FormToggle { ...props } className={ `${ props.className } ${ styles[ 'is-compact' ] }` } />
);

export default CompactFormToggle;
