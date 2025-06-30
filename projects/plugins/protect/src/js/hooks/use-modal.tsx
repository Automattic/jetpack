import { createContext, useContext, useState } from 'react';
import type { Dispatch, FC, ReactNode, SetStateAction } from 'react';

interface ModalState {
	type?: string;
	props?: Record< string, unknown >;
}

interface ModalContextValue {
	modal: ModalState | null;
	setModal: Dispatch< SetStateAction< ModalState | null > > | null;
}

const ModalContext = createContext< ModalContextValue >( { modal: null, setModal: null } );

export const ModalProvider: FC< { children: ReactNode } > = ( { children } ) => {
	const [ modal, setModal ] = useState< ModalState | null >( {} );

	return <ModalContext.Provider value={ { modal, setModal } }>{ children }</ModalContext.Provider>;
};

/**
 * Modal Hook
 *
 * @return {object} Modals object
 */
export default function useModal() {
	const { modal, setModal } = useContext( ModalContext );

	return {
		modal,
		setModal,
	};
}
