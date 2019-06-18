const puppeteer = require('puppeteer')

module.exports = {
  async getHeadlessChrome() {
    const browser = await puppeteer.launch({args: ['--no-sandbox']})
    return browser.newPage()
  }
}
