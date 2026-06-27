import { ChangeDetectionStrategy, Component } from "@angular/core";
import { ToastrService } from "ngx-toastr";


@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.component.html',
})
export class HomeComponent {
  constructor(private toastService: ToastrService) {}
  testToastr():void {
    this.toastService.success('This is a success message!', 'Success');
  }

}