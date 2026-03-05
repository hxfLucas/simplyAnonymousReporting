import { getAuthenticatedUserData, runWithAuthUser, AuthenticatedUser } from '../authContext';

describe('Auth Context Helpers', () => {
  describe('getAuthenticatedUserData', () => {
    it('returns user data when context exists', (done) => {
      const mockUser: AuthenticatedUser = {
        id: 'user-123',
        role: 'admin',
        companyId: 'company-456',
      };

      runWithAuthUser(mockUser, () => {
        const user = getAuthenticatedUserData();
        expect(user).toEqual(mockUser);
        expect(user.id).toBe('user-123');
        expect(user.role).toBe('admin');
        expect(user.companyId).toBe('company-456');
        done();
      });
    });

    it('throws error when no auth context exists', () => {
      expect(() => getAuthenticatedUserData()).toThrow('No authenticated user in context');
    });

    it('isolates context between different runs', (done) => {
      const user1: AuthenticatedUser = {
        id: 'user-1',
        role: 'manager',
        companyId: 'company-1',
      };

      const user2: AuthenticatedUser = {
        id: 'user-2',
        role: 'admin',
        companyId: 'company-2',
      };

      runWithAuthUser(user1, () => {
        const retrieved1 = getAuthenticatedUserData();
        expect(retrieved1).toEqual(user1);

        // Simulate a second async operation with different user
        runWithAuthUser(user2, () => {
          const retrieved2 = getAuthenticatedUserData();
          expect(retrieved2).toEqual(user2);
          expect(retrieved2).not.toEqual(user1);
          done();
        });
      });
    });

    it('returns different user data when role is manager', (done) => {
      const managerUser: AuthenticatedUser = {
        id: 'manager-789',
        role: 'manager',
        companyId: 'company-789',
      };

      runWithAuthUser(managerUser, () => {
        const user = getAuthenticatedUserData();
        expect(user.role).toBe('manager');
        done();
      });
    });
  });
});
