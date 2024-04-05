const redirect_uri = "https://token.grant.waynecommand.com/ms/complete"

const ms_authorize_uri = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize`
const ms_token_uri = `https://login.microsoftonline.com/common/oauth2/v2.0/token`
const ms_scope = "offline_access Files.ReadWrite.All"

import {store} from './store'



// https://learn.microsoft.com/zh-cn/entra/identity-platform/v2-oauth2-auth-code-flow

// 1. 用户访问 worker /ms/onedrive
// 2. worker 请求授权代码（跳转到微软）
// 3. worker 接收回调参数
// 4. worker 用 code 请求 token （显示到页面上）

export {
	msAuthorize,
	msComplete,
	msToken,
}

// 微软请求授权代码
// 同时请求一个 ID 令牌或混合流
const msAuthorize = (req) =>  {

	const url = new URL(ms_authorize_uri);
	const { searchParams, search } = url;

	searchParams.append("client_id", store.ms_client_id)
	searchParams.append("response_type", "code")
	searchParams.append("response_mode", "form_post") // fragment/form_post/query
	searchParams.append("redirect_uri", redirect_uri)
	searchParams.append("scope", ms_scope)
	searchParams.append("state", "wayne") // custom sting

	// 跳转到新页面，必须打开登陆页面才可以
	return new Response(url.toString());
}


const msComplete = async (req) => {

	if (req.method === 'GET') return Response.json({error: "method not supported."})


	// https://developers.cloudflare.com/workers/examples/read-post/
	const formData = await req.formData();

	let code = formData.get("code");
	let state = formData.get("state");

	if ("wayne" !== state) return Response.json({error: "invalid_request"})

	let err_code = formData.get("error");
	let err_desc = formData.get("error_description");

	// err
	// error
	// error_description
	if (err_code) {
		return Response.json({
			error: err_code,
			error_description: err_desc
		})
	}

	// return new Response(code)

	return msToken(code)
}

const msToken = async (code) => {

	let formData = new URLSearchParams()
	formData.set("client_id", store.ms_client_id)
	formData.set("client_secret", store.ms_client_secret)
	formData.set("code", code)
	formData.set("grant_type", "authorization_code")
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
			"Content-Type": "application/x-www-form-urlencoded",
		},
		// Change a Cloudflare feature on the outbound response
		cf: { apps: false },
	}

	const tokenRequest = new Request(ms_token_uri, _init)

	const token = await fetch(tokenRequest)

	return Response.json(await token.json())
}



const msTokenRefresh = async (refreshToken) => {

	let formData = new URLSearchParams()
	formData.set("grant_type", "refresh_token")
	formData.set("client_id", store.ms_client_id)
	formData.set("client_secret", store.ms_client_secret)
	formData.set("redirect_uri", redirect_uri)
	formData.set("refresh_token", refreshToken)

	const _init = {
		// Change method
		method: "POST",
		// Change body
		body: formData,
		// Change the redirect mode.
		redirect: "follow",
		// Change headers, note this method will erase existing headers
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		// Change a Cloudflare feature on the outbound response
		cf: { apps: false },
	}

	const refreshRequest = new Request("https://login.microsoftonline.com/common/oauth2/v2.0/token", _init)

	const token = await fetch(refreshRequest)

	return Response.json(await token.json())
}
