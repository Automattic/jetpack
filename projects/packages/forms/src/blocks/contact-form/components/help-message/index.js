import clsx from 'clsx';
import GridiconModule from 'gridicons';
import './style.scss';

const Gridicon = GridiconModule.default || GridiconModule;

export default ( { children = null, isError = false, ...props } ) => {
	const classes = clsx( 'help-message', {
		'help-message-is-error': isError,
	} );

	return (
		children && (
			<div className={ classes } { ...props }>
				{ isError && (
					<Gridicon
						icon="notice-outline"
						size="24"
						aria-hidden="true"
						role="img"
						focusable="false"
					/>
				) }
				<span>{ children }</span>
			</div>
		)
	);
};
