import { onRequest } from '../../../../../../../functions/api/events/[id]/items/[itemId].js';
import { pagesFunction } from '$lib/server/pages-function.js';

export const PATCH = pagesFunction(onRequest);
export const DELETE = pagesFunction(onRequest);
export const OPTIONS = pagesFunction(onRequest);
