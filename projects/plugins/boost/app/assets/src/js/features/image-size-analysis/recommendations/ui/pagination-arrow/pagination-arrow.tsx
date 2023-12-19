import { navigate } from '$lib/utils/navigate';
import React, { useMemo } from 'react';

interface PaginationLinkProps {
	group: string;
	direction: 'left' | 'right';
	current: number;
	total: number;
	children: React.ReactNode;
}

const PaginationLink: React.FC< PaginationLinkProps > = ( {
	group,
	direction,
	current,
	total,
	children,
} ) => {
	const inactive = useMemo(
		() => ( direction === 'left' ? current === 1 : current === total ),
		[ direction, current, total ]
	);

	const page = useMemo(
		() => ( direction === 'left' ? current - 1 : current + 1 ),
		[ direction, current ]
	);

	if ( inactive ) {
		return <span className="jb-pagination__page jb-pagination__page--inactive">{ children }</span>;
	}
	return (
		<a
			href={ `#/image-size-analysis/${ group }/${ page }` }
			onClick={ () => navigate( `/image-size-analysis/${ group }/${ page }` ) }
			className="jb-pagination__page"
		>
			{ children }
		</a>
	);
};

export default PaginationLink;