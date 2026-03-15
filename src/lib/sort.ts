import type { SortTerm } from './types/types';

const slugToTerm: Record<string, SortTerm> = {
	trending: 'trending',
	active: 'commitsYear',
	recent: 'firstAdded'
};

const termToSlug: Record<string, string> = {
	trending: 'trending',
	commitsYear: 'active',
	firstAdded: 'recent'
};

export const SORT_SLUGS = new Set(Object.keys(slugToTerm));

export function sortSlugToTerm(slug: string): SortTerm | undefined {
	return slugToTerm[slug];
}

export function sortTermToSlug(term: SortTerm): string | undefined {
	return termToSlug[term];
}
