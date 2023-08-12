import { writable } from 'svelte/store';
import type { AllCategories } from '../lib/types/types';

export const categoryStore = writable<AllCategories>({});
