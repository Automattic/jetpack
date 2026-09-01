import clsx from 'clsx';

export default function Row( { children, className } ) {
	return <div className={ clsx( 'tiled-gallery__row', className ) }>{ children }</div>;
}
