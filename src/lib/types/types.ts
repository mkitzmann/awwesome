export type Project = {
	name: string | null;
	primary_url: string | null;
	source_url: string | null;
	demo_url: string | null;
	description: string | null;
	license: string | null;
	stack: string | null;
	category?: Category[];
	stars?: number | null;
	avatar_url?: string | null;
	last_commit?: Date | null;
};

export type Category = {
	slug: string;
	name: string;
};

export interface ProjectCollection {
	projects: Project[];
	categories: Category[];
}

export interface GithubQueryResult {
	search: {
		repos: [
			{
				repo: GithubRepo;
			}
		];
	};
	rateLimit: {
		limit: number;
		cost: number;
		remaining: number;
		resetAt: string;
	};
}

export interface GithubRepo {
	url: string;
	name: string;
	owner?: {
		avatarUrl: string;
	};
	repositoryTopics?: {
		edges: {
			node: {
				topic: {
					name: string;
				};
			};
		}[];
	};
	languages?: {
		edges: {
			node: {
				name: string;
			};
		}[];
	};
	archivedAt?: string;
	collaborators?: {
		totalCount: number;
	};
	descriptionHTML?: string;
	latestRelease?: {
		createdAt: string;
	};
	licenseInfo?: {
		name: string;
	};
	openGraphImageUrl?: string;
	stargazerCount?: number;
	defaultBranchRef: {
		target: {
			history: {
				edges: [
					{
						node: {
							authoredDate;
							message;
						};
					}
				];
			};
		};
	};
	openIssues?: {
		totalCount: number;
	};
}
