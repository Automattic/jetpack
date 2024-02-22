import React from 'react';
import styles from './row-title.module.scss';

interface RowTitleProps {
	title: string;
	url: string;
}

const RowTitle: React.FC< RowTitleProps > = ( { title, url } ) => {
	const urlWithoutProtocol = url.replace( /^https?:\/\/(www\.)?/, '' );

	return (
		<>
			<b className={ styles.heading } title={ title }>
				{ title }
			</b>
			<a href={ url } target="_blank" rel="noopener noreferrer" className={ styles.link }>
				{ urlWithoutProtocol }
			</a>
		</>
	);
};

export default RowTitle;
