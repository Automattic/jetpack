import { __ } from '@wordpress/i18n';
import TableRow from '../table-row/table-row';

const BrokenDataRow: React.FC = () => {
	return (
		<TableRow enableTransition={ false }>
			<div className="jb-table-row-title">
				{ __( 'An error occurred while loading this entry.', 'jetpack-boost' ) }
			</div>
		</TableRow>
	);
};

export default BrokenDataRow;
