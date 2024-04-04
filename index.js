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

console.log(coolifyUrl, coolifyUrl, coolifyAppId)

// hide your token from the logs in github actions
core.setSecret(coolifyToken)

const url = `${coolifyUrl}/api/v1/deploy?uuid=${coolifyAppId}`
let data = '';

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
    }).on('end', () => {    
        console.log("Received response", res.statusCode, data)

        const jsonData = JSON.parse(data)

        if (Array.isArray(jsonData)) {
            console.log(`Successfully redeployed!`)
            console.log("Got data back!", jsonData)
        }
    }).on("error", (error) => {
        core.setFailed('Error - ' + error.message)
        process.exit(3)
    })
})

req.end()