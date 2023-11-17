import classNames from 'classnames';
import { createInterpolateElement } from '@wordpress/element';
import { standardizeError } from '../../lib/utils/standardize-error';
import NoticeOutline from '../../svg/notice-outline';
import styles from './error-notice.module.scss';

type ErrorNoticeProps = {
	title: string;
	error: string | Error;
	data?: string;
	suggestion?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	vars?: Record< string, React.ReactElement< any, string | React.JSXElementConstructor< any > > >;
	children?: React.ReactNode;
	actionButton?: React.ReactNode;
};

const ErrorNotice = ( {
	title,
	error,
	data,
	suggestion,
	vars = {},
	children,
	actionButton,
}: ErrorNoticeProps ) => {
	const description = standardizeError( error ).message;

	return (
		<div className={ classNames( styles.errorNotice ) }>
			<NoticeOutline className={ classNames( styles.icon ) } />

			<div className={ classNames( styles.offset ) }>
				<div className={ classNames( styles.description ) }>{ title }</div>

				<div className={ classNames( styles.message ) }>
					{ children || description }

					{ data && <pre className={ classNames( styles.data ) }>{ data }</pre> }

					{ suggestion && (
						<p className={ classNames( styles.suggestion ) }>
							{ createInterpolateElement( suggestion, vars ) }
						</p>
					) }
				</div>
			</div>

			<div className={ classNames( styles.mainAction ) }>{ actionButton }</div>
		</div>
	);
};

export default ErrorNotice;
