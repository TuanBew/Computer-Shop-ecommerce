// Page Object Model: Home Page
const { By, until } = require('selenium-webdriver');

class HomePage {
  constructor(driver) {
    this.driver = driver;
    this.url = 'http://localhost:5173';
    this.productCards = By.css('[class*="wrapper"], [class*="card"], h4');
  }

  async navigate() {
    await this.driver.get(this.url);
    await this.driver.sleep(2000); // Wait for React to render
  }

  async getTitle() {
    return await this.driver.getTitle();
  }

  async countProductCards() {
    try {
      const cards = await this.driver.findElements(this.productCards);
      return cards.length;
    } catch {
      return 0;
    }
  }

  async isLoaded() {
    try {
      await this.driver.wait(
        until.elementLocated(By.css('body')),
        10000
      );
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = HomePage;
