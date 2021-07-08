import { Authentication } from './authentication'
import { FHIR } from './fhir'
import express from 'express'
import cors from 'cors'

require("dotenv").config()
const app = express()

var allowedOrigins = ['http://localhost:3333']

app.use(express.json(), cors({

  origin: function(origin, callback){
    // allow requests with no origin
    // (like mobile apps or curl requests)
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      var msg = 'The CORS policy for this site does not ' +
                'allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}))


app.post('/fhir', (req, res) => {
    const fhirPayload = req.body

    Authentication.authenticate()
    .then(response => {
        if(response.access_token){
            FHIR.sendRequest(fhirPayload, response.access_token).then(response => {
                res.status(200).send(response)
            }).catch(error => {
                console.error(error)
                res.status(400).send('Something went wrong with FHIR request!')
            })
        }
    })
    .catch(error => {
      console.error(error)
      res.status(400).send('Request was unsuccessful')
    })
})


const port = process.env.PORT || 3000

app.listen(port, () => console.log(`App listening on PORT ${port}`))

