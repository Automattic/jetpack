import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { createContext, useContext } from 'react';
import type { FC, ReactNode } from 'react';

type FourForFourState = {
	eligible: boolean;
	status: string | null;
};

type WelcomeGuideSelect = {
	isFourForFourEligible: () => boolean;
	getFourForFourStatus: () => string | null;
};

const FourForFourContext = createContext< FourForFourState >( { eligible: false, status: null } );

export const useFourForFour = () => useContext( FourForFourContext );

export const FourForFourProvider: FC< { children: ReactNode } > = ( { children } ) => {
	const value = useSelect( select => {
		const store = select( 'automattic/wpcom-welcome-guide' ) as WelcomeGuideSelect;
		return {
			eligible: store.isFourForFourEligible(),
			status: store.getFourForFourStatus(),
		};
	}, [] );

	const { fetchFourForFour } = useDispatch( 'automattic/wpcom-welcome-guide' );

	useEffect( () => {
		fetchFourForFour();
	}, [ fetchFourForFour ] );

	return <FourForFourContext.Provider value={ value }>{ children }</FourForFourContext.Provider>;
};
