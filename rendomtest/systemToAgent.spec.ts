import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { SystemDashboardPage } from '../pages/SystemDashboardPage';
import { systemUser } from '../test_data/testData';
import { readAgentData, updateAgentData } from '../utils/agentJson';

test.describe('System to Agent deposit', () => {
  test('System deposits 2000 Tk to a newly activated Agent @smoke @positive', async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    const systemPage = new SystemDashboardPage(page);
    const agent = await readAgentData();

    await loginPage.open();
    await loginPage.login(systemUser.email, systemUser.password);
    await systemPage.verifySystemLoginIsSuccessful();
    await systemPage.openCashIn();
    await systemPage.depositToAgent(agent.phoneNumber, 2000);
    await systemPage.verifyDepositIsSuccessful(2000);
    await updateAgentData({ balance: 2000 });
    await page.pause()
    await systemPage.logout();
    
  });
});
