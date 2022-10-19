const axios = require('axios')
const express = require('express')

const app = express()
const cache = {}
let buffer = []
app.get('/api/:name/:year', async (req, res) => {
  if (cache[req.url]) {
    res.json(cache[req.url])
    return
  }
  try {
    const rsp = await axios.get(
      `https://skyline.github.com/${req.params.name}/${req.params.year}.json`,
      {responseType: 'stream'}
    )
    rsp.data.pipe(res)
    rsp.data.on('data', (chunk) => {
      buffer.push(chunk)
    })
    rsp.data.on('end', () => {
      cache[req.url] = JSON.parse(Buffer.concat(buffer).toString('utf8'))
      buffer = []
    })
  } catch (error) {
    console.error(error)
    res.status(500).end()
  }
})

app.listen(8002, () => console.log('listen on 8002'))
