import { Request, Response, NextFunction } from 'express';
import { getAppDataSource } from '../database/data-source';
import { runWithEntityManager } from '../database/transactionContext';

/**
 * Express middleware that wraps the downstream handler in a database transaction.
 *
 * - Starts a transaction before passing control to the next handler.
 * - Commits when the handler sends a successful response (HTTP status < 400).
 * - Rolls back when the handler sends an error response (HTTP status >= 400) or
 *   when an unhandled error propagates through `next(err)`.
 *
 * Handlers inside this middleware can access the active EntityManager via
 * `getTransactionalEntityManager()` from `shared/database/transactionContext`.
 */
export async function withTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
  const queryRunner = getAppDataSource().createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();

  let settled = false;

  const settle = async (commit: boolean): Promise<void> => {
    if (settled || queryRunner.isReleased) return;
    settled = true;
    try {
      if (commit) {
        await queryRunner.commitTransaction();
      } else {
        await queryRunner.rollbackTransaction();
      }
    } catch (settleErr) {
      // If commit fails, attempt a best-effort rollback before re-throwing.
      if (commit && !queryRunner.isReleased) {
        try { await queryRunner.rollbackTransaction(); } catch { /* ignore secondary error */ }
      }
      throw settleErr;
    } finally {
      if (!queryRunner.isReleased) {
        await queryRunner.release();
      }
    }
  };

  // Intercept res.json — the primary response method used by Express handlers.
  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    const shouldCommit = res.statusCode < 400;
    settle(shouldCommit)
      .then(() => originalJson(body))
      .catch((err) => next(err));
    return res;
  };

  // Intercept res.send — used by res.status(204).send() and similar.
  const originalSend = res.send.bind(res);
  res.send = function (body?: any) {
    const shouldCommit = res.statusCode < 400;
    settle(shouldCommit)
      .then(() => originalSend(body))
      .catch((err) => next(err));
    return res;
  };

  // Run the rest of the middleware chain inside the transaction context so that
  // handlers can retrieve the EntityManager via getTransactionalEntityManager().
  runWithEntityManager(queryRunner.manager, () => next());
}

export default withTransaction;
