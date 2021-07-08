import fetch from 'node-fetch'

export class Authentication {

	public static async authenticate() {
		const OAUTH_URL = process.env.OAUTH_URL || ''
		const CLIENT_ID = process.env.CLIENT_ID || ''
		const SECRET = process.env.SECRET || ''
		const SCOPE = process.env.SCOPE || ''
		const FHIR_BRIDGE_URL = process.env.FHIR_BRIDGE_URL || ''

		const credentials = new URLSearchParams({
			'grant_type': 'client_credentials', 
			'client_id': CLIENT_ID,
			'client_secret': SECRET,
			'scope': SCOPE,
		})
		const response = await fetch(OAUTH_URL, {
			headers: {'content-type':'application/x-www-form-urlencoded'},
			method: 'POST',
			body: credentials.toString(),
		  })

		const responseText = await response.text();
		if (!response.ok) {
			console.error('Error in authentication')
			throw new Error(responseText)
		} else {
			console.info(responseText)
			return JSON.parse(responseText)
		}
	}

}