import { createInterpolateElement } from '@wordpress/element';
import { standardizeError } from '$lib/utils/standardize-error';
import NoticeOutline from '$svg/notice-outline';
import styles from './error-notice.module.scss';
import React from 'react';

type ErrorNoticeProps = {
	title: string;
	error?: string | Error;
	data?: string;
	suggestion?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	vars?: Record< string, React.ReactElement >;
	children?: React.ReactNode;
	actionButton?: React.ReactNode;
};

const ErrorNotice = ( {
	title,
	error = new Error( title ),
	data,
	suggestion,
	vars = {},
	children,
	actionButton,
}: ErrorNoticeProps ) => {
	const description = standardizeError( error ).message;

	return (
		<div className={ styles[ 'error-notice' ] }>
			<div>
				<NoticeOutline className={ styles.icon } />
			</div>

			<div className={ styles.offset }>
				<div className={ styles.description }>{ title }</div>

				<div className={ styles.message }>
					{ children || description }

					{ data && <pre className={ styles.data }>{ data }</pre> }

					{ suggestion && (
						<p className={ styles.suggestion }>{ createInterpolateElement( suggestion, vars ) }</p>
					) }
				</div>
			</div>

			<div className={ styles[ 'main-action' ] }>{ actionButton }</div>
		</div>
	);
};

export default ErrorNotice;
