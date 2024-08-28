import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { createContext, useCallback, useContext, useState } from 'react';
import { FREE_PLUGIN_SUPPORT_URL, PAID_PLUGIN_SUPPORT_URL } from '../constants';
import usePlan from './use-plan';

interface NoticeState {
	message?: string | JSX.Element;
	dismissable?: boolean;
	duration?: number;
	type?: 'success' | 'info' | 'error';
}

interface NoticeContextValue {
	notice: NoticeState;
	setNotice: React.Dispatch< React.SetStateAction< NoticeState > >;
}

const NoticeContext = createContext< NoticeContextValue | undefined >( undefined );

export const NoticeProvider: React.FC< { children: React.ReactNode } > = ( { children } ) => {
	const [ notice, setNotice ] = useState< NoticeState >( null );

	return (
		<NoticeContext.Provider value={ { notice, setNotice } }>{ children }</NoticeContext.Provider>
	);
};

/**
 * Notices Hook
 *
 * @return {object} Notices object
 */
export default function useNotices() {
	const { hasPlan } = usePlan();
	const { notice, setNotice } = useContext( NoticeContext );

	const clearNotice = useCallback( () => {
		setNotice( null );
	}, [ setNotice ] );

	const showSuccessNotice = useCallback(
		( message: string ) => {
			setNotice( {
				type: 'success',
				dismissable: true,
				duration: 7_500,
				message,
			} );
		},
		[ setNotice ]
	);

	const showSavingNotice = useCallback(
		( message?: string ) => {
			setNotice( {
				type: 'info',
				dismissable: false,
				message: message || __( 'Saving Changes…', 'jetpack-protect' ),
			} );
		},
		[ setNotice ]
	);

	const showErrorNotice = useCallback(
		( message: string ) => {
			setNotice( {
				type: 'error',
				dismissable: true,
				message: (
					<>
						{ message || __( 'An error occurred.', 'jetpack-protect' ) }{ ' ' }
						{ createInterpolateElement(
							__(
								'Please try again or <supportLink>contact support</supportLink>.',
								'jetpack-protect'
							),
							{
								supportLink: (
									<ExternalLink
										href={ hasPlan ? PAID_PLUGIN_SUPPORT_URL : FREE_PLUGIN_SUPPORT_URL }
									/>
								),
							}
						) }
					</>
				),
			} );
		},
		[ hasPlan, setNotice ]
	);

	return {
		notice,
		clearNotice,
		showSavingNotice,
		showSuccessNotice,
		showErrorNotice,
	};
}
