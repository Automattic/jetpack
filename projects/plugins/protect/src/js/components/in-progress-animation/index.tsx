import ScanAnim1 from './scan-animation-1.svg';
import ScanAnim2 from './scan-animation-2.svg';
import ScanAnim3 from './scan-animation-3.svg';
import styles from './styles.module.scss';

const InProgressAnimation: React.FC = () => {
	return (
		<div className={ styles.scan__animation }>
			<img className={ styles.scan__animation_el_1 } src={ ScanAnim1 } alt="" />
			<img className={ styles.scan__animation_el_2 } src={ ScanAnim2 } alt="" />
			<img className={ styles.scan__animation_el_3 } src={ ScanAnim3 } alt="" />
		</div>
	);
};

export default InProgressAnimation;
