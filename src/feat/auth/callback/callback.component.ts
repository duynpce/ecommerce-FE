import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UI_CLASS_NAME } from '../../../shared/constant/className.constant';
import {
  isAuthServer,
  setStoredAuthServer,
  type AuthServer,
} from '../auth.type';
import type { CallbackStatus } from './callback.type';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-callback',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './callback.component.html',
})
export class CallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);

  readonly ui = UI_CLASS_NAME;
  readonly authService = inject(AuthService);

  ngOnInit(): void {
    const authServerParam = this.route.snapshot.paramMap.get('authServer');

    if (!authServerParam || !isAuthServer(authServerParam)) {
      this.toastr.error('Invalid auth server parameter.', 'Error');
      this.router.navigate(['/home'], { replaceUrl: true });
      return;
    }

    setStoredAuthServer(authServerParam);
    const roles = this.route.snapshot.queryParamMap.getAll('role');
    if (roles.length > 0) {
      localStorage.setItem('roles', JSON.stringify(roles));
    }

    this.authService.isLoggedIn().subscribe((loggedIn) => {
      if (!loggedIn) {
        this.router.navigate(['/login'], { replaceUrl: true });
        return;
      }
      

      const previousPath = this.route.snapshot.queryParamMap.get('previousPath');
      this.router.navigate(
        [previousPath && previousPath !== '/login' ? previousPath : '/home'],
        { replaceUrl: true }
      );
    });
  }
}