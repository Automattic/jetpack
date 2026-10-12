import { EarnPage } from '../../src/features/wpcom-earn/js/page.tsx';
import { Placeholder } from '../../src/features/wpcom-earn/js/placeholder.tsx';

const Stage = () => {
	return (
		<EarnPage active="ads">
			<Placeholder section="ads" />
		</EarnPage>
	);
};

export { Stage as stage };
