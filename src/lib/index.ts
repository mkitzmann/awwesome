export const allCategory = { name: 'All', slug: '' };
export const chunkSize = 50;

export const removeTrailingSlashes = (input?: string | unknown) => {
	if (!input || typeof input !== 'string') {
		return;
	}
	return input.replace(/\/$/, '');
};
