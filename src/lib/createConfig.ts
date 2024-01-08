import type { Config } from '../types';
import { config } from '../config';

export const appConfig: Config = {
	requestDelay: process.env.REQUEST_DELAY ? Number(process.env.REQUEST_DELAY) : config.requestDelay,
	urls: config.urls,
	lowCommitCount: process.env.LOW_COMMIT_COUNT
		? Number(process.env.LOW_COMMIT_COUNT)
		: config.lowCommitCount,
	chunkSize: process.env.CHUNK_SIZE ? Number(process.env.CHUNK_SIZE) : config.chunkSize
};
