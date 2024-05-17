import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import { name as detailsName, settings as detailsSettings } from './details/';
import edit from './edit';
import { name as heroName, settings as heroSettings } from './hero/';
import { name as ingredientItemName, settings as ingredientItemSettings } from './ingredient-item/';
import {
	name as ingredientsListName,
	settings as ingredientsListSettings,
} from './ingredients-list/';
import save from './save';
import { name as stepName, settings as stepSettings } from './step/';
import { name as stepsName, settings as stepsSettings } from './steps/';

registerJetpackBlockFromMetadata(
	metadata,
	{
		edit,
		save,
	},
	[
		{ name: detailsName, settings: detailsSettings },
		{ name: heroName, settings: heroSettings },
		{ name: ingredientsListName, settings: ingredientsListSettings },
		{ name: ingredientItemName, settings: ingredientItemSettings },
		{ name: stepsName, settings: stepsSettings },
		{ name: stepName, settings: stepSettings },
	]
);
