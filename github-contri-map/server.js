const axios = require('axios')
const express = require('express')

const app = express()

app.get('/api/:name/:year', async (req, res) => {
  try {
    const rsp = await axios.get(
      `https://skyline.github.com/${req.params.name}/${req.params.year}.json`,
      {responseType: 'stream'}
    )
    rsp.data.pipe(res)
  } catch (error) {
    res.status(500).end()
  }
})

app.listen(8002, () => console.log('listen on 8002'))
