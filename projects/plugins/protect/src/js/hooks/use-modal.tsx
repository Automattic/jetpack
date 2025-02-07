import React, { createContext, useContext, useState } from 'react';

interface ModalState {
	type?: string;
	props?: Record< string, unknown >;
}

interface ModalContextValue {
	modal: ModalState | null;
	setModal: React.Dispatch< React.SetStateAction< ModalState | null > > | null;
}

const ModalContext = createContext< ModalContextValue >( { modal: null, setModal: null } );

export const ModalProvider: React.FC< { children: React.ReactNode } > = ( { children } ) => {
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
