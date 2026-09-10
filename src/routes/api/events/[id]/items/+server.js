import { onRequest } from '../../../../../../functions/api/events/[id]/items.js';
import { pagesFunction } from '$lib/server/pages-function.js';

export const POST = pagesFunction(onRequest);
export const OPTIONS = pagesFunction(onRequest);
