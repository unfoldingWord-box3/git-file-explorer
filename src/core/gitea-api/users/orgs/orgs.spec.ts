/// <reference types="jest" />
import { authorizationHeaders } from '../../authentication';
import { getCurrentUserOrgs } from './orgs';
jest.mock('../../http', () => ({
  get: () => Promise.resolve([{
    'avatar_url': 'https://bg.door43.org/avatars/17918',
    'description': '',
    'full_name': '',
    'id': 17918,
    'location': '',
    'username': 'TC-Create-Test-Org',
    'visibility': 'public',
    'website': '',
  }]), apiPath: 'api/v1',
}));

describe('Organization Lists', () => {
  it('should list organizations with correct config', async () => {
    const username = 'test';
    const password = 'password';
    const expected = [
      {
        'avatar_url': 'https://bg.door43.org/avatars/17918',
        'description': '',
        'full_name': '',
        'id': 17918,
        'location': '',
        'username': 'TC-Create-Test-Org',
        'visibility': 'public',
        'website': '',
      },
    ];

    const authHeaders = authorizationHeaders({ username, password });
    const config = { server: 'https://bg.door43.org/', headers: { ...authHeaders } };
    const organizations = await getCurrentUserOrgs({ config });
    expect(organizations).toMatchObject(expected);
  });
});
