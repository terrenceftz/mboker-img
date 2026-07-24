import type { APIRoute } from 'astro';

import { getUploadRoot } from '../../server/media/paths';
import { serveMedia } from '../../server/media/serve';

const respond: APIRoute = ({ params, request }) => serveMedia(getUploadRoot(), params.path ?? '', request.method);

export const GET = respond;
export const HEAD = respond;
