import './style.css';
import prototype from './prototype';
import { load } from './Images';
import { measure } from './Measurements';

prototype();

document.addEventListener('DOMContentLoaded', async () => {
	const nodes = document.querySelectorAll('body *');

	const images = await load(Array.from(nodes));
	const measuredImages = measure(images);

	console.log("Measured images", measuredImages);
});
