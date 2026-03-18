import type { Config } from '../types';
import { config } from '../config';

export const appConfig: Config = {
	lowCommitCount: config.lowCommitCount,
	chunkSize: config.chunkSize
};
