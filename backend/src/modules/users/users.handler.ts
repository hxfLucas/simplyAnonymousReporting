import { Request, Response } from 'express';
import { isValidEmail } from '../../shared/utils/validateEmail';
import { AddUserDto, UpdateUserPasswordDto, UpdateOwnSettingsDto, UserResponseDto, ListUsersResponseDto } from './users.dtos';
import { ErrorResponseDto } from '../../shared/errors/errorResponse.dto';
import { createUserForCompany, deleteUserFromCompany, updateUserPassword as updateUserPasswordService, listUsers, updateOwnSettings } from './users.service';
import { getAuthenticatedUserData } from '../../shared/auth/authContext';

export async function addUser(req: Request<{}, {}, AddUserDto>, res: Response<UserResponseDto | ErrorResponseDto>) {

  const { email: rawEmail, password: rawPassword } = req.body ?? {};
  const email = String(rawEmail ?? '').trim().toLowerCase();
  const password = String(rawPassword ?? '').trim();

  if (!isValidEmail(email)) return res.status(400).json({ error: 'Invalid or missing email' });
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const created = await createUserForCompany({ email, password });
  const { passwordHash, ...safe } = (created as any);
  return res.status(201).json(safe);
}

export async function updateUserPassword(req: Request<{}, {}, UpdateUserPasswordDto>, res: Response<ErrorResponseDto>) {
  const { id, password: rawPassword } = req.body ?? {};
  const password = String(rawPassword ?? '').trim();

  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'Missing or invalid user id' });
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  await updateUserPasswordService({ id, password });
  return res.sendStatus(204);
}

export async function removeUser(req: Request<{ id: string }>, res: Response<ErrorResponseDto>) {
  const id: string = req.params?.id;
  if (!id) return res.status(400).json({ error: 'Missing user id' });

  const companyId = getAuthenticatedUserData().companyId;
  await deleteUserFromCompany(id,companyId);
  return res.status(204).send();
}

export async function usersList(req: Request, res: Response<ListUsersResponseDto | ErrorResponseDto>) {
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const { search } = req.query;

  const companyId = getAuthenticatedUserData().companyId;

  const result = await listUsers({ companyId, offset, limit, search: search ? String(search) : undefined });

  return res.json(result);
}

export async function updateOwnSettingsHandler(req: Request<{}, { ok: boolean }, UpdateOwnSettingsDto>, res: Response<{ ok: boolean } | ErrorResponseDto>, next: Function) {
  try {
    const { action, currentPassword, newPassword } = req.body ?? {};
    if (!action) return res.status(400).json({ error: 'Missing action' });

    if (action === 'change_password') {
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'currentPassword and newPassword are required' });
      }
      if (String(newPassword).length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
      }
      await updateOwnSettings({ action, currentPassword: String(currentPassword), newPassword: String(newPassword) });
    } else if (action === 'sign_out_all_devices') {
      await updateOwnSettings({ action });
    } else {
      return res.status(400).json({ error: 'Unknown action' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
}
