import { serve } from 'https://deno.land/std@0.217.0/http/server.ts';
import { serveDir, serveFile } from 'https://deno.land/std@0.217.0/http/file_server.ts';

serve(async (req) => {
    const pathname = new URL(req.url).pathname;

    // Try to serve the static file.
    const fileResponse = await serveDir(req, {
        fsRoot: 'dist',
        urlRoot: '',
    });

    // If the file is found, return it.
    if (fileResponse.status !== 404) {
        return fileResponse;
    }

    // If the file is not found, it might be a client-side route.
    // Serve the index.html file to handle SPA routing.
    const indexPath = `${Deno.cwd()}/dist/index.html`;
    try {
        const indexFile = await Deno.open(indexPath);
        return await serveFile(req, indexPath);
    } catch {
        // If index.html is also not found, return the original 404.
        return fileResponse;
    }
});