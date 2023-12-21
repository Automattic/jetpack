import SpeedScore from '$features/speed-score/speed-score';
import Footer from '$layout/footer/footer';
import Header from '$layout/header/header';
import { criticalCssStateCreated, isGenerating } from '$features/critical-css';
import { hasPrioritySupport } from '$lib/utils/paid-plan';
import Support from './support/support';
import Tips from './tips/tips';
import { useSingleModuleState } from '$features/module/lib/stores';
import { useEffect, useState } from 'react';
import { DataSyncProvider } from '@automattic/jetpack-react-data-sync-client';
import classNames from 'classnames';
import styles from './settings-page.module.scss';

type SettingsPageProps = {
	children: React.ReactNode;
};

const SettingsPage = ( { children }: SettingsPageProps ) => {
	const [ isGeneratingValue, setIsGeneratingValue ] = useState( false );
	const [ performanceHistoryState ] = useSingleModuleState( 'performance_history' );

	useEffect( () => {
		const unsubscribe = isGenerating.subscribe( value => {
			setIsGeneratingValue( value );
		} );

		return () => {
			unsubscribe();
		};
	}, [] );

	return (
		<div id="jb-dashboard" className="jb-dashboard jb-dashboard--main">
			<Header />

			<div className="jb-section jb-section--alt jb-section--scores">
				<SpeedScore
					criticalCssCreated={ criticalCssStateCreated }
					criticalCssIsGenerating={ isGeneratingValue }
					performanceHistoryNeedsUpgrade={ ! performanceHistoryState?.available }
				/>
			</div>

			{ children && (
				<div className={ classNames( 'jb-section jb-section--main', styles.section ) }>
					{ children }
				</div>
			) }

			<Tips />

			{ hasPrioritySupport && <Support /> }

			<Footer />
		</div>
	);
};

export default function ( props: SettingsPageProps ) {
	return (
		<DataSyncProvider>
			<SettingsPage { ...props } />
		</DataSyncProvider>
	);
}

// export default SettingsPage;
