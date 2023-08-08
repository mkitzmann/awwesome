export const allCategory = { name: 'All', slug: '' };

export const removeTrailingSlashes = (input?: string | unknown) => {
	if (!input || typeof input !== 'string') {
		return;
	}
	return input.replace(/\/$/, '');
};
