export type Project = {
	name: string | null;
	primary_url: string | null;
	source_url: string | null;
	demo_url: string | null;
	description: string | null;
	license: string | null;
	stack: string | null;
	category?: string | null;
	stars?: number | null;
};

export interface ProjectCollection {
	projects: Project[];
}

export interface GithubQueryResult {
	search: {
		repos: [
			{
				repo: GithubRepo;
			}
		];
	};
}

export interface GithubRepo {
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
}
