export type Project = {
	name: string;
	source_url: string;
	category: string;
	demo_url: string | null;
	description: string;
	license?: string;
	stars?: number;
};

export interface ProjectCollection {
	projects: Project[];
}

export interface Repository {
	search: {
		repos: [
			{
				repo: {
					url: string;
					description: string | null;
					name: string;
					stargazers: {
						totalCount: number;
					};
					allIssues: {
						totalCount: number;
					};
					openIssues: {
						totalCount: number;
					};
				};
			}
		];
	};
}
