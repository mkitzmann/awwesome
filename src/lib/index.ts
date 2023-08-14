export const allCategory = { name: 'All', slug: '' };
export const chunkSize = 40;

export const removeTrailingSlashes = (input?: string | unknown): string => {
	if (!input || typeof input !== 'string') {
		return;
	}
	return input.replace(/\/$/, '');
};
