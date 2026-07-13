import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { ToastrService } from "ngx-toastr";
import { AuthService } from "../auth/auth.service";


@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.component.html',
})
export class HomeComponent {
  private readonly toastService = inject(ToastrService);
  private readonly authService = inject(AuthService);
  
  testToastr():void {
    this.toastService.success('This is a success message!', 'Success');
  }

  testAuthService(): void {
    this.authService.isLoggedIn().subscribe({
      next: (isLoggedIn) => {
        if (isLoggedIn) {
          this.toastService.success('User is logged in.', 'Auth Status');
        }
        else {
          this.toastService.warning('User is not logged in.', 'Auth Status');
        } 
      }
    });
  }
  

}