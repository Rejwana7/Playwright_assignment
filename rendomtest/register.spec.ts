import { expect, test } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { SignUpPage } from '../pages/SignUpPage';
import { createRandomAgent } from '../test_data/testData';
import { writeAgentData } from '../utils/agentJson';

test.describe('Agent registration', () => {
  test('registers a new Agent successfully  @positive', async ({ page }) => {
    const homePage = new HomePage(page);
    const signUpPage = new SignUpPage(page);
    const agent = createRandomAgent();

    await homePage.open();
    await homePage.verifyPageIsLoaded();
    await homePage.navigateToSignUp();
    await signUpPage.verifyPageIsLoaded();

    await signUpPage.registerUser(agent);
    await signUpPage.verifyRegistrationIsSuccessful();
    await signUpPage.verifyAccountIsPendingApproval();
    await writeAgentData({ ...agent, status: 'pending', balance: 0 });
  });

  test('rejects Agent registration with a non-Gmail address @negative ', async ({
    page,
  }) => {
    const signUpPage = new SignUpPage(page);
    const agent = {
      ...createRandomAgent(),
      email: `agent${Date.now()}@example.com`,
    };

    await signUpPage.open();
    await signUpPage.registerUser(agent);

    await signUpPage.verifyRegistrationError(
      'Only Gmail addresses (@gmail.com) are allowed for registration.',
    );
    await expect(page).toHaveURL('/register');
  });
});
