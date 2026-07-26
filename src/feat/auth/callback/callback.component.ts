import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UI_CLASS_NAME } from '../../../shared/constant/className.constant';
import { isAuthServer, setStoredAuthServer } from '../auth.type';
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
  readonly authService = inject(AuthService);

  readonly ui = UI_CLASS_NAME;

  ngOnInit(): void {
    const authServerParam = this.route.snapshot.paramMap.get('authServer');

    if (!authServerParam || !isAuthServer(authServerParam)) {
      this.toastr.error('Invalid auth server parameter.', 'Error');
      this.router.navigate(['/home'], { replaceUrl: true });
      return;
    }

    setStoredAuthServer(authServerParam);

    // Persist roles if provided
    const roles = this.route.snapshot.queryParamMap.getAll('role');
    if (roles.length > 0) {
      localStorage.setItem('roles', JSON.stringify(roles));
    }

    // isActive from query param:
    //   present as 'false' → user needs to complete profile
    //   absent or any other value  → treat as active
    const isActiveParam = this.route.snapshot.queryParamMap.get('isActive');
    const isActive = isActiveParam === null ? true : isActiveParam === 'true';
    localStorage.setItem('isActive', String(isActive));

    this.authService.isLoggedIn().subscribe((loggedIn) => {
      if (!loggedIn) {
        this.router.navigate(['/login'], { replaceUrl: true });
        return;
      }

      if (!isActive) {
        this.router.navigate(['/complete-profile'], { replaceUrl: true });
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
