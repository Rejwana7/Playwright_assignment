import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { AgentTestData } from '../test_data/testData';

export interface StoredAgentData extends AgentTestData {
  status?: 'pending' | 'active';
  balance?: number;
  oldPassword?: string;
  lastCustomerPhone?: string;
  lastDepositAmount?: number;
  statementCsvFile?: string;
}

const agentJsonPath = path.resolve(process.cwd(), 'test_data', 'agent.json');

export async function writeAgentData(agent: StoredAgentData): Promise<void> {
  await writeFile(agentJsonPath, JSON.stringify(agent, null, 2), 'utf8');
}

export async function readAgentData(): Promise<StoredAgentData> {
  try {
    const content = await readFile(agentJsonPath, 'utf8');
    return JSON.parse(content) as StoredAgentData;
  } catch {
    throw new Error(
      'Agent data is unavailable. Run the registration project first.',
    );
  }
}

export async function updateAgentData(
  updates: Partial<StoredAgentData>,
): Promise<void> {
  const agent = await readAgentData();
  await writeAgentData({ ...agent, ...updates });
}
