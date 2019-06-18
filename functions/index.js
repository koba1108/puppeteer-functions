const functions = require('firebase-functions')
const scraper = require('./scraper')

let page

exports.getTrends = functions.https.onRequest(async (req, res) => {
  const url = 'https://qiita.com'
  if (!page) {
    page = await scraper.getHeadlessChrome()
  }
  await page.goto(url, {waitUntil: 'networkidle2'})
  const result = await page.evaluate(() => {
    const nodeList = [...document.querySelectorAll('.tr-Item_body')]
    return nodeList.map(article => {
      const a = article.querySelector('a')
      const href = a.href
      const title = a.textContent
      const author = article.querySelector('.tr-Item_author').textContent
      const time = article.querySelector('time').textContent
      const like = article.querySelector('.tr-Item_likeCount').textContent
      // console.log(href, title, author, time, like)
      return {href, title, author, time, like}
    })
  })
  res.set('Content-Type', 'application/json')
  res.send(result)
})
