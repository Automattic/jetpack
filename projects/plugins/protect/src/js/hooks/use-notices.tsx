import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import { createContext, useCallback, useContext, useState } from 'react';
import { FREE_PLUGIN_SUPPORT_URL, PAID_PLUGIN_SUPPORT_URL } from '../constants';
import usePlan from './use-plan';
import type { Dispatch, FC, ReactNode, SetStateAction } from 'react';

interface NoticeState {
	message?: string | JSX.Element;
	spokenMessage?: string;
	// Changes on every notice, so an identical repeat still remounts and re-announces.
	id?: number;
	dismissable?: boolean;
	duration?: number;
	type?: 'success' | 'info' | 'warning' | 'error';
}

interface NoticeContextValue {
	notice: NoticeState;
	setNotice: Dispatch< SetStateAction< NoticeState > >;
}

let noticeId = 0;

const NoticeContext = createContext< NoticeContextValue | undefined >( undefined );

export const NoticeProvider: FC< { children: ReactNode } > = ( { children } ) => {
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
				id: ++noticeId,
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
				id: ++noticeId,
				type: 'info',
				dismissable: false,
				message: message || __( 'Saving Changes…', 'jetpack-protect' ),
			} );
		},
		[ setNotice ]
	);

	const showErrorNotice = useCallback(
		( message: string ) => {
			const error = message || __( 'An error occurred.', 'jetpack-protect' );
			const advice = __(
				'Please try again or <supportLink>contact support</supportLink>.',
				'jetpack-protect'
			);

			setNotice( {
				id: ++noticeId,
				type: 'error',
				dismissable: true,
				// The same translated string, with the interpolation tags stripped.
				spokenMessage: `${ error } ${ advice.replace( /<\/?supportLink>/g, '' ) }`,
				message: (
					<>
						{ error }{ ' ' }
						{ createInterpolateElement( advice, {
							supportLink: (
								<Link
									openInNewTab
									href={ hasPlan ? PAID_PLUGIN_SUPPORT_URL : FREE_PLUGIN_SUPPORT_URL }
									children={ null }
								/>
							),
						} ) }
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
