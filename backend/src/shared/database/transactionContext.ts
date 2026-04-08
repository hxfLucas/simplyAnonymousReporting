import { AsyncLocalStorage } from 'async_hooks';
import { EntityManager } from 'typeorm';

const storage = new AsyncLocalStorage<EntityManager>();

export function runWithEntityManager(em: EntityManager, fn: () => void): void {
  storage.run(em, fn);
}

/**
 * Returns the EntityManager bound to the current request's transaction.
 * Only available inside route handlers wrapped with the `withTransaction` middleware.
 */
export function getTransactionalEntityManager(): EntityManager {
  const em = storage.getStore();
  if (!em) {
    throw new Error('No transaction context found. Ensure the withTransaction middleware is applied to this route.');
  }
  return em;
}
