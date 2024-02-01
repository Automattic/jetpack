import './style.scss';

type PopoverProps = {
	action: React.ReactNode;
	icon?: React.ReactNode;
	children?: React.ReactNode;
};

const Popover: React.FC< PopoverProps > = ( { icon, children, action } ) => {
	return (
		<div className="jp-popover">
			<div className="jp-popover__icon">{ icon }</div>
			<div className="jp-popover__body">{ children }</div>
			<div className="jp-popover__action">{ action }</div>
		</div>
	);
};

export default Popover;
