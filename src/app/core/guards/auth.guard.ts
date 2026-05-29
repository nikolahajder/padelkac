import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const { data } = await auth.getSessionAsync();
  if (!data.session) {
    router.navigate(['/admin/login']);
    return false;
  }
  return true;
};
