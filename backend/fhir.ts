import fetch from 'node-fetch'

export class FHIR {

	public static async sendRequest(fhirPayload: string, accessToken: string) {
		const FHIR_BRIDGE_URL = process.env.FHIR_BRIDGE_URL || ''

		const response = await fetch(FHIR_BRIDGE_URL, {
			method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer '+ accessToken, 
            },
            body: JSON.stringify(fhirPayload),    
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