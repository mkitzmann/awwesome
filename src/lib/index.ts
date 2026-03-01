export const allCategory = { name: 'All', slug: '' };

export const removeTrailingSlashes = (input?: string | unknown): string | undefined => {
	if (!input || typeof input !== 'string') {
		return undefined;
	}
	return input.replace(/\/$/, '');
};
