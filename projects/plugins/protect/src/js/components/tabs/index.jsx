import { NavLink } from 'react-router-dom';
import styles from './styles.module.scss';

const Tabs = ( { children, className = '' } ) => {
	return <nav className={ `${ styles.tabs } ${ className }` }>{ children }</nav>;
};

export const Tab = ( { label, link } ) => {
	return (
		<NavLink
			to={ link }
			// eslint-disable-next-line react/jsx-no-bind
			className={ ( { isActive } ) =>
				isActive ? `${ styles.tab } ${ styles[ 'tab--active' ] }` : styles.tab
			}
		>
			{ label }
		</NavLink>
	);
};

export default Tabs;
