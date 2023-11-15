const headers = {
    'content-type' : 'application/json',
}

export async function GraphqlController (req: Request): Promise<Response> {
    if (req.body) {
        const json: { query: string } = await Bun.readableStreamToJSON(req.body);
        if (json && json.query) {
            const graphqlMethod: string | undefined = json.query.match(/^([a-zA-Z]*)/s)[1];
            if (graphqlMethod) {
                try {
                    if (graphqlMethod) {
                        const bunFile = Bun.file(`./responses/${ graphqlMethod }.json`);
                        const json = await bunFile.text();
                        return new Response(json, { status: 200, headers });
                    } return new Response('500 Internal Server Error', { status: 500 });
                } catch {
                    return new Response('404 Not Found', { status: 404 });
                }
            }
        }
    }
    return new Response('404 Not Found', { status: 404 });
}
