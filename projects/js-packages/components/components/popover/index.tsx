import './style.scss';
import type { FC, ReactNode } from 'react';

type PopoverProps = {
	action: ReactNode;
	icon?: ReactNode;
	children?: ReactNode;
};

const Popover: FC< PopoverProps > = ( { icon, children, action } ) => {
	return (
		<div className="jp-popover">
			<div className="jp-popover__icon">{ icon }</div>
			<div className="jp-popover__body">{ children }</div>
			<div className="jp-popover__action">{ action }</div>
		</div>
	);
};

export default Popover;
