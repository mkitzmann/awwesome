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
	avatar_url?: string | null;
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
	name: string;
	owner: {
		avatarUrl: string;
	};
	repositoryTopics: {
		edges: {
			node: {
				topic: {
					name: string;
				};
			};
		}[];
	};
	languages: {
		edges: {
			node: {
				name: string;
			};
		}[];
	};
	archivedAt: string;
	collaborators: {
		totalCount: number;
	};
	descriptionHTML: string;
	latestRelease: {
		createdAt: string;
	};
	licenseInfo: {
		name: string;
	};
	openGraphImageUrl: string;
	stargazerCount: number;
	updatedAt: string;
	openIssues: {
		totalCount: number;
	};
}
