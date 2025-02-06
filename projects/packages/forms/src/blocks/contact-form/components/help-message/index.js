import clsx from 'clsx';
import GridiconNoticeOutline from 'gridicons/dist/notice-outline';
import './style.scss';

export default ( { children = null, isError = false, ...props } ) => {
	const classes = clsx( 'help-message', {
		'help-message-is-error': isError,
	} );

	return (
		children && (
			<div className={ classes } { ...props }>
				{ isError && (
					<GridiconNoticeOutline size="24" aria-hidden="true" role="img" focusable="false" />
				) }
				<span>{ children }</span>
			</div>
		)
	);
};
