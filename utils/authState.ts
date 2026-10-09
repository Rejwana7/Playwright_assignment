import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import type { BrowserContext } from '@playwright/test';

export const authStatePath = path.resolve(
  process.cwd(),
  'test_data',
  'auth.json',
);

export async function saveAuthState(context: BrowserContext): Promise<void> {
  await mkdir(path.dirname(authStatePath), { recursive: true });
  await context.storageState({ path: authStatePath });
}
