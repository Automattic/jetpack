import React from 'react';
import TableRow from '../table-row/table-row';

const LoadingRow: React.FC = () => {
	return (
		<TableRow enableTransition={ false }>
			<div className="jb-table-row__title">...</div>
		</TableRow>
	);
};

export default LoadingRow;
