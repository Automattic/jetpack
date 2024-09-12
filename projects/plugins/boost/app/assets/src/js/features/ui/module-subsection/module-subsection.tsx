import { ReactNode } from 'react';
import styles from './module-subsection.module.scss';

interface ModuleSubsectionProps {
	children: ReactNode;
}

const ModuleSubsection = ( { children }: ModuleSubsectionProps ) => {
	return <div className={ styles.wrapper }>{ children }</div>;
};

export default ModuleSubsection;
