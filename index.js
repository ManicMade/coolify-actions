const core = require("@actions/core")

let coolifyUrl = core.getInput("coolifyUrl")
const accessToken = core.getInput("accessToken")
const stackName = core.getInput("stackName")

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

core.setSecret(coolifyUrl)
core.setSecret(accessToken)

let stackId = 0;
let endpoint = 0;

const getStackId = (callback) => {
  // const url = `${coolifyUrl}/api/endpoints/${endpointId}`
  const url = `${coolifyUrl}/api/stacks`
  let data = '';

  console.log(`Getting stack id for stack: ${stackName}`)

  const req = client.request(url, {
    method: "GET",
    headers: {
      "X-API-Key": accessToken,
    }
  }, (res) => {
    if (res.statusCode !== 200) {
      callback(false)
      core.setFailed('HTTP ' + res.statusCode + ' - ' + res.statusMessage)
      process.exit(2)
    }

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {    
      //console.log("Received response", res.statusCode, data)

      const jsonData = JSON.parse(data)

      if (Array.isArray(jsonData)) {
        // console.log(`Successfully redeployed ${jsonData.Name}!`)
        // console.log("Got data back!", jsonData)

        for (i in jsonData) {
          const stack = jsonData[i]
          
          if (stack.Name == stackName) {
            console.log(`Identified stackId: ${stackId} and endpoint: ${endpoint}`)
            
            stackId = stack.Id
            endpoint = stack.EndpointId

            callback(true)
          }
        }
      }
    })
    .on("error", (error) => {
      callback(false)
      core.setFailed('Error - ' + error.message)
      process.exit(3)
    })
  })

  req.end()
}

const doRedeploy = (attempt = 1) => {
  let data = '';

  
  const postData = JSON.stringify({
    pullImage: true,
    RepositoryAuthentication: false,
    RepositoryPassword: "",
    RepositoryReferenceName: null, //branch,
    RepositoryUsername: "",
    env: [],
    prune: true,
  })

  const url = `${coolifyUrl}/api/stacks/${stackId}/git/redeploy?endpointId=${endpoint}`

  console.log("Hitting URL", url)
  console.log("With data:", postData)

  const req = client.request(url, {
    method: "PUT",
    headers: {
      "X-API-Key": accessToken,
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(postData)
    }
  }, (res) => {
    if (res.statusCode !== 200 && res.statusCode !== 500) {
      core.setFailed('HTTP ' + res.statusCode + ' - ' + res.statusMessage)
      process.exit(2)
    }

    // A chunk of data has been received.
    res.on('data', (chunk) => {
      data += chunk;
    });

    // The whole response has been received. Print out the result.
    res.on('end', () => {    
      //console.log("Received response", res.statusCode, data)

      if (res.statusCode == 500) {
        console.log(`Attempt #${attempt} failed.`)

        if (attempt < 3) {
          console.log("Retrying!")

          attempt++

          setTimeout(() => {
            console.log("Retrying now")
            doRedeploy(attempt)
          }, 5000)

          return
        } else {
          console.log("Reached max attempts!")
          core.setFailed('Error - Retried and retried and couldnt succeed')
          process.exit(3)
        }
      }

      const jsonData = JSON.parse(data)

      if (jsonData.Name) {
        console.log(`Successfully redeployed ${jsonData.Name}!`)
      }
    })
    .on("error", (error) => {
      core.setFailed('Error - ' + error.message)
      process.exit(3)
    })
  });

  req.write(postData)
  req.end()
}

const doStartStop = (stop, callback) => {
  const callAPI = (callback, attempt = 1) => {
    const payload = JSON.stringify({
      endpointId: endpoint,
      id: stackId
    })

    let data = '';
    const action = stop ? 'stop' : 'start'
    const url = `${coolifyUrl}/api/stacks/${stackId}/${action}?endpointId=${endpoint}`
  
    console.log("Hitting URL", url)
    console.log("With data:", payload)
  
    const req = client.request(url, {
      method: "POST",
      headers: {
        "X-API-Key": accessToken,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload)
      }
    }, (res) => {
      if (res.statusCode !== 200 && res.statusCode !== 500 && res.statusCode !== 400) {
        core.setFailed('HTTP ' + res.statusCode + ' - ' + res.statusMessage)
        process.exit(2)
      }
  
      // A chunk of data has been received.
      res.on('data', (chunk) => {
        data += chunk;
      });
  
      // The whole response has been received. Print out the result.
      res.on('end', () => {    
        //console.log("Received response", res.statusCode, data)
  
        if (res.statusCode == 500) {
          console.log(`Attempt #${attempt} failed.`)
  
          if (attempt < 5) {
            console.log("Waiting to retry.. ")
  
            attempt++

            setTimeout(() => {
              console.log("Retrying now")

              callAPI(callback, attempt)
            }, 5000)

            return 
          } else {
            console.log("Reached max attempts!")
            core.setFailed('Error - Retried and retried and couldnt succeed')
            process.exit(3)
          }
        }
  
        const jsonData = JSON.parse(data)
  
        if (jsonData) {
          callback(jsonData)
        } else {
          core.setFailed('Error - Failed to parse JSON:'  + data)
          process.exit(3)
        }
      })
      .on("error", (error) => {
        core.setFailed('Error - ' + error.message)
        process.exit(3)
      })
    });
  
    req.write(payload)
    req.end()
  }

  callAPI(callback)
}

getStackId((success) => {
  if (success) {
    console.log("We got stack id and endpoint", stackId, endpoint)

    doStartStop(true, () => {
      console.log("Stack has been stopped")

      doStartStop(false, () => {
        console.log("Stack has been started again")
      })
    })

    
    //doRedeploy()
  } else {
    console.log("Failed to get stack id and endpoint")
  }
})