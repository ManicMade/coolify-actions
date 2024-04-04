const core = require("@actions/core")

let coolifyUrl = core.getInput("coolifyUrl")
const coolifyToken = core.getInput("coolifyToken")
const coolifyAppId = core.getInput("coolifyAppId")

let client

if (coolifyUrl.includes("http:")) {
  client = require("http")
} else {
  client = require("https")

  if (!coolifyUrl.includes("https:")) {
    coolifyUrl = `https://${coolifyUrl}`
  }
}

if (coolifyUrl.substring(coolifyUrl.length - 1) === "/") {
  coolifyUrl = coolifyUrl.substring(0, coolifyUrl.length - 1)
}

// hide your token from the logs in github actions
core.setSecret(coolifyToken)

const url = `${coolifyUrl}/api/v1/deploy?uuid=${coolifyAppId}`
let data = '';

console.log(`Contacting Coolify @ ${url} ..`)

const req = client.request(url, {
    method: "GET",
    headers: {
        "Authorization": `Bearer ${coolifyToken}`,
    }
}, (res) => {
    if (res.statusCode !== 200) {
        core.setFailed('HTTP ' + res.statusCode + ' - ' + res.statusMessage)
        process.exit(2)
    }

    res.on('data', (chunk) => {
        data += chunk;

        console.log('Receiving response ..')
    }).on('end', () => {    
        console.log(`Received response code ${res.statusCode}.`)
        // console.log("Received response:", res.statusCode, data)

        const jsonData = JSON.parse(data)

        if (typeof jsonData == 'object') {
            let msg = false

            if (Array.isArray(jsonData.deployments)) {
                const deployment = jsonData.deployments[0]
                
                msg = deployment ? deployment.message : false       

                console.log(`Coolify said: ${msg}`)
            }


            if (!msg) {
                console.log(`Coolify's response was not understood.`)
                console.log(jsonData)
            }            
        }
    }).on("error", (error) => {
        core.setFailed('Error - ' + error.message)
        process.exit(3)
    })
})

req.end()