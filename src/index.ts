import { GraphqlController } from './controllers/';

const headers = {
    'content-type' : 'application/json',
}

const logger = async (req: Request, next: (req: Request) => Promise<Response>): Promise<Response> => {
    const startQuery = Bun.nanoseconds();
    return await next(req).then(res => {
        console.log(`${ req.method } - ${ new URL(req.url).pathname } - ${ Math.round((Bun.nanoseconds() - startQuery) / 1_000_000) }ms`);
        return res;
    });
}

interface IRoute {
    name: string;
    path: string;
    method: string;
    filename?: string;
    controller?: (req: Request) => Response | Promise<Response> 
    supportOptionsRequest?: boolean; 
}

const routes: IRoute[] = [
    {
        name: 'auth',
        path: '/view/auth/',
        method: 'GET',
        filename: 'auth',
        supportOptionsRequest: true,
    },
    {
        name: 'graphql',
        path: '/graphql',
        method: 'POST',
        controller: GraphqlController,
        supportOptionsRequest: true,
    }
]

async function readFileByFileName (filename: string): Promise<Response> {
    try {
        if (filename) {
            const bunFile = Bun.file(`./responses/${ filename }.json`);
            const json = await bunFile.text();
            return new Response(json, { status: 200, headers });
        } return new Response('500 Internal Server Error', { status: 500 });
    } catch {
        return new Response('404 Not Found', { status: 404 });
    }
     
}

async function router (req: Request): Promise<Response> {
    if (req && req.url) {
        const requestPath = new URL(req.url).pathname;
        if (requestPath) {
            const route = routes.find(routeItem => routeItem.path === requestPath);
            if (route) {
                if (route.method === req.method) {
                    if (route.controller) {
                        return GraphqlController(req);
                    } else if (route.filename) {
                        return readFileByFileName(route.filename);
                    }
                } else if (req.method === 'OPTIONS' && route.supportOptionsRequest) {
                    return new Response(undefined, { status: 200 });
                }
            }
            return new Response('400 Bad Request', { status: 400 });
        }
    } else {
        return new Response('500 Internal Server Error', { status: 500 });
    }
}

Bun.serve({
    port: 4040,
    fetch: async (req: Request) => logger(req, router),
});
console.log('Bun server started on port 4040');
