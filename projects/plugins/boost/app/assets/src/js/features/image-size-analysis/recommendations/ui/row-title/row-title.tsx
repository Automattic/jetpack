import React from 'react';

interface RowTitleProps {
	title: string;
	url: string;
}

const RowTitle: React.FC< RowTitleProps > = ( { title, url } ) => {
	const urlWithoutProtocol = url.replace( /^https?:\/\/(www\.)?/, '' );

	return (
		<>
			<b className="jb-row-title__heading" title={ title }>
				{ title }
			</b>
			<a href={ url } target="_blank" rel="noopener noreferrer" className="jb-row-title__link">
				{ urlWithoutProtocol }
			</a>
		</>
	);
};

export default RowTitle;
