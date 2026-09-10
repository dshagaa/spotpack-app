import { onRequest } from '../../../../functions/api/events.js';
import { pagesFunction } from '$lib/server/pages-function.js';

export const GET = pagesFunction(onRequest);
export const POST = pagesFunction(onRequest);
export const OPTIONS = pagesFunction(onRequest);
