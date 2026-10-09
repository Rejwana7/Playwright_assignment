import { expect, type Locator, type Page } from '@playwright/test';

export type UserRole = 'Customer' | 'Agent' | 'Merchant';

export interface UserRegistrationData {
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
  nid: string;
  role: UserRole;
}

// Handles user registration and registration-status validation.
export class SignUpPage {
  static readonly PATH = '/register';

  readonly page: Page;
  readonly pageHeading: Locator;
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly phoneNumberInput: Locator;
  readonly nidInput: Locator;
  readonly roleSelect: Locator;
  readonly createAccountButton: Locator;
  readonly pendingApprovalNotice: Locator;
  readonly registrationSuccessMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageHeading = page.getByText('Create an Account', { exact: true });
    this.fullNameInput = page.getByRole('textbox', {
      name: 'Full Name',
      exact: true,
    });
    this.emailInput = page.getByRole("textbox",{name:"Email Address"});
    this.passwordInput = page.locator('input[type="password"]');
    this.phoneNumberInput = page.getByRole("textbox",{name:"Phone Number"});
    this.nidInput = page.getByRole("textbox",{name:"NID"});
    this.roleSelect = page.getByRole('combobox');
    this.createAccountButton = page.getByRole('button', { name: 'Create Account' });
    this.pendingApprovalNotice = page.getByText( "account will be pending approval" );
    this.registrationSuccessMessage = page.getByText('Registration successful', {
      exact: false,
    });
  }

  async open(): Promise<void> {
    await this.page.goto(SignUpPage.PATH);
  }

  async verifyPageIsLoaded(): Promise<void> {
    await expect(this.page).toHaveURL('/register');
    await expect(this.pageHeading).toBeVisible();
    await expect(this.createAccountButton).toBeVisible();
  }

  async selectRole(role: UserRole): Promise<void> {
    // Select Customer, Agent, or Merchant from the role dropdown.
    await this.roleSelect.click();
    await this.page.getByRole('option', { name: role }).click();
  }

  async registerUser(data: UserRegistrationData): Promise<void> {
    // Wait for Next.js hydration so WebKit does not reset early input values.
    await this.page.waitForLoadState('networkidle');

    await this.fullNameInput.fill(data.fullName);
    await this.emailInput.fill(data.email);
    await this.passwordInput.fill(data.password);
    await this.phoneNumberInput.fill(data.phoneNumber);
    await this.nidInput.fill(data.nid);
    await this.selectRole(data.role);
    await this.createAccountButton.click();
  }

  async verifyRegistrationIsSuccessful(): Promise<void> {
    await expect(this.registrationSuccessMessage).toBeVisible();
  }

  async verifyRegistrationError(message: string): Promise<void> {
    await expect(this.page.getByText(message, { exact: true })).toBeVisible();
  }

  async verifyAccountIsPendingApproval(): Promise<void> {
    // New accounts remain pending until an Admin activates them.
    await expect(this.pendingApprovalNotice).toBeVisible();
  }
}
