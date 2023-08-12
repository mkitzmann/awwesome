// import type { Project } from './types/types';

// export co
// const extractCategories = (projects: Project[]) => {
// 	[...currentCategory].reduce(
// 		(prev, current) => (prev[current] = prev[current] ?? {}),
// 		allCategoriesObject
// 	);
// 	return  transformObjectToArray(allCategoriesObject);
//
// };

// import {Category} from "./types/types";

// function transformObjectToArray(categories: Category[]): { category: string }[] {
// 	const array = [];
//
// 	categories.forEach((category) => {
// 		let entry = [{ category: category.slug }];
// 		if (category.children && category.children?.length > 0) {
// 			entry = entry.concat(transformObjectToArray(category.children));
// 		}
// 		array.concat(entry);
// 	});
//
// 	return array;
// }
