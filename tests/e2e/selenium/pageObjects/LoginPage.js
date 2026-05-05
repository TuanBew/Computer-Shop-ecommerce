// Page Object Model: Login Page
const { By, until } = require('selenium-webdriver');

class LoginPage {
  constructor(driver) {
    this.driver = driver;
    this.url = 'http://localhost:5173/login';
    this.emailInput = By.css('input[type="email"], input[name="email"]');
    this.passwordInput = By.css('input[type="password"]');
    this.submitButton = By.css('button[type="submit"]');
    this.errorMessage = By.css('.ant-message-error, [class*="error"]');
  }

  async navigate() {
    await this.driver.get(this.url);
    await this.driver.wait(until.elementLocated(this.emailInput), 10000);
  }

  async fillEmail(email) {
    const input = await this.driver.findElement(this.emailInput);
    await input.clear();
    await input.sendKeys(email);
  }

  async fillPassword(password) {
    const input = await this.driver.findElement(this.passwordInput);
    await input.clear();
    await input.sendKeys(password);
  }

  async submit() {
    const btn = await this.driver.findElement(this.submitButton);
    await btn.click();
  }

  async getErrorText() {
    try {
      const el = await this.driver.wait(until.elementLocated(this.errorMessage), 5000);
      return await el.getText();
    } catch {
      return null;
    }
  }
}

module.exports = LoginPage;
