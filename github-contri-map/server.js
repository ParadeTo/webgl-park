const axios = require('axios')
const express = require('express')

const app = express()
const cache = {}
const buffer = []
app.get('/api/:name/:year', async (req, res) => {
  if (cache[req.url]) return res.end(cache[req.url])
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
      cache[req.url] = Buffer.concat(buffer).toString('utf8')
    })
  } catch (error) {
    res.status(500).end()
  }
})

app.listen(8002, () => console.log('listen on 8002'))
