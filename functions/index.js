const functions = require('firebase-functions')
const scraper = require('./scraper')

let page

const settings = [
  {
    id: 'nikkei',
    name: '日経イベント＆セミナー',
    baseUrl: 'https://events.nikkei.co.jp/soon/',
  },
]

async function getPage() {
  return page ? page : await scraper.getHeadlessChrome()
}

function getSetting(id) {
  return settings.find(s => s.id === id)
}

async function getEventByPage(page) {
  return await page.evaluate(() => {
    const nodeList = [...document.querySelectorAll('article.sw-Card')]
    const nextLink = document.querySelector('.archive-Pager_Inner > a.next')
    const events = nodeList.map(article => {
      const result = {
        isClose: false,
        title: '',
        datetime: '',
        place: '',
        image: '',
        tags: [],
      }
      try {
        result.isClose = !!article.querySelector('.sw-Card_Labels > .sw-Card_EndLabel')
        result.title = article.querySelector('.sw-Card_Title > .sw-Card_TitleText').textContent
        result.datetime = article.querySelector('.sw-Card_TextArea > .sw-Card_Date').textContent
        result.place = article.querySelector('.sw-Card_TextArea > .sw-Card_Place').textContent
        const imageTag = article.querySelector('.sw-Card_MainImageInner > img')
        result.image = imageTag ? imageTag.src : ''
        article.querySelectorAll('.sw-Card_TagList > li > a').forEach(a => result.tags.push(a.textContent))
      } catch (e) {
        console.error(e.message)
      }
      return result
    })
    return {
      events: events,
      nextLink: nextLink ? nextLink.href : '',
    }
  })
}

exports.getTrends = functions.https.onRequest(async (req, res) => {
  try {
    const nikkei = getSetting('nikkei')
    page = await getPage()
    const result = {
      id: nikkei.id,
      name: nikkei.name,
      baseUrl: nikkei.baseUrl,
      events: [],
    }
    let url = nikkei.baseUrl
    do {
      await page.goto(url, {
        waitUntil: ['load', 'networkidle2']
      })
      const { events, nextLink } = await getEventByPage(page)
      events.map(event => result.events.push(event))
      url = nextLink ? nextLink : null
    } while (url)
    res.set('Content-Type', 'application/json')
    res.send(result)
  } catch (e) {
    console.error(e)
    res.set('Content-Type', 'application/json')
    res.send(e.message)
  }
})
