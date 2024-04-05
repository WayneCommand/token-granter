const redirect_uri = "https://token.grant.waynecommand.com/gh/complete"

const gh_authorize_uri = 'https://github.com/login/oauth/authorize'
const gh_token_uri = 'https://github.com/login/oauth/access_token'
const gh_scope = "user"

import {store} from './store'


// https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps

export {
	ghAuthorize,
	ghComplete,
	ghToken,
}

const ghAuthorize = (req) =>  {

	const url = new URL(gh_authorize_uri);
	const { searchParams, search } = url;

	searchParams.append("client_id", store.gh_client_id)
	searchParams.append("redirect_uri", redirect_uri)
	searchParams.append("scope", gh_scope)
	searchParams.append("state", "wayne") // custom sting

	// 跳转到新页面，必须打开登陆页面才可以
	return new Response(url.toString());
}


const ghComplete = async (req) => {

	// if (req.method === 'GET') return Response.json({error: "method not supported."})

	const url = new URL(req.url);
	const {pathname, searchParams} = url

	let code = searchParams.get("code");
	let state = searchParams.get("state");

	if ("wayne" !== state) return Response.json({error: "invalid_request"})

	return ghToken(code)
}

const ghToken = async (code) => {

	let formData = new URLSearchParams()
	formData.set("client_id", store.gh_client_id)
	formData.set("client_secret", store.gh_client_secret)
	formData.set("code", code)
	formData.set("redirect_uri", redirect_uri)


	const _init = {
		// Change method
		method: "POST",
		// Change body
		body: formData,
		// Change the redirect mode.
		redirect: "follow",
		// Change headers, note this method will erase existing headers
		headers: {
			"Content-Type": "application/x-www-form-urlencoded"
		},
		// Change a Cloudflare feature on the outbound response
		cf: { apps: false },
	}

	const tokenRequest = new Request(gh_token_uri, _init)

	const token = await fetch(tokenRequest)

	// default resp
	const searchParams = new URLSearchParams(await token.text());
	let tokens = Object.fromEntries(searchParams.entries())

	return Response.json(tokens)
}
