import {store, update as storeUpdate} from './store'
import { msAuthorize, msComplete, msToken} from './microsoft'

export default {
	async fetch(request, env, ctx) {

		storeUpdate(env);

		return router(request, env, ctx)
	},
};


const router = (request, env, ctx) => {

	const url = new URL(request.url);
	const { pathname, search } = url;

	switch (pathname) {
		case "/": return new Response('Hello Cloudflare Worker!')
		case "/ms/authorize": return msAuthorize(request);
		case "/ms/complete": return msComplete(request);
		case "/env/all": return Response.json({"env": "secret"});
		default: return Response.json({"message": "404 Not Found."})
	}
}
