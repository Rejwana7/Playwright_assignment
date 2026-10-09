import { expect, type Locator, type Page } from '@playwright/test';

// Handles home-page navigation and validation.
export class HomePage {
  static readonly PATH = '/';

  readonly page: Page;
  readonly heroHeading: Locator;
  readonly signUpLink: Locator;
  readonly loginLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heroHeading = page.getByRole('heading', {
      name: 'Learn QA Testing on a',
    });
    // Sign Up and Login also appear in the footer, so use the first match.
    this.signUpLink = page
      .getByRole('link', { name: 'Sign Up', exact: true })
      .first();
    this.loginLink = page
      .getByRole('link', { name: 'Login', exact: true })
      .first();
  }

  async open(): Promise<void> {
    await this.page.goto(HomePage.PATH);
  }

  async navigateToSignUp(): Promise<void> {
    await this.signUpLink.click();
    await expect(this.page).toHaveURL('/register');
  }

  async navigateToLogin(): Promise<void> {
    await this.loginLink.click();
    await expect(this.page).toHaveURL('/login');
  }

  async verifyPageIsLoaded(): Promise<void> {
    await expect(this.page).toHaveURL('/');
    await expect(this.heroHeading).toBeVisible();
    await expect(this.signUpLink).toBeVisible();
    await expect(this.loginLink).toBeVisible();
  }
}
