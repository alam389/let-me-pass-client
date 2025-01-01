import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { decode } from 'html-entities';
import { MatIconModule } from '@angular/material/icon';
import { CryptoService } from '../../services/crypto.service';


@Component({
  selector: 'app-modify-password',
  templateUrl: './html/modify-password.html',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatIconModule
  ],
  styleUrls: ['./styles/modify-password-dialog.scss']
})
export class ModifyPassword {
  modifyForm: FormGroup;
  hidePassword: boolean = true; // For password visibility toggle


  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ModifyPassword>,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private cryptoService: CryptoService,

    @Inject(MAT_DIALOG_DATA) public data: any // Receiving the passed data

  ) {
    this.modifyForm = this.fb.group({
      username: [data.username, Validators.required],
      siteurl: [decode(data.siteurl), [Validators.required, Validators.pattern('(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})([/\\w .-]*)*/?')]],
      password: ["", Validators.required],
      notes: [data.notes]
    });
  }

  
  async onSave(): Promise<void> {
    if (this.modifyForm.valid) {
      const updatedData = {
        ...this.data, // Include existing data like password_id
        ...this.modifyForm.value
      };

      try {
        // Encrypt the updated password
        const encryptedPassword = await this.cryptoService.encryptData(updatedData.password);
        updatedData.password = encryptedPassword;

        this.userService.modifyUserLogin(
          updatedData.password_id,
          updatedData.sitename,
          updatedData.username,
          updatedData.siteurl,
          updatedData.password,
          updatedData.notes
        ).subscribe({
          next: (response: any) => {
            this.snackBar.open(response.message, 'Close', {
              duration: 3000,
            });
            this.dialogRef.close(this.modifyForm.value);
          },
          error: (err) => {
            this.snackBar.open('Error updating password', 'Close', {
              duration: 3000,
            });
          }
        });

      } catch (error) {
        console.error('Error encrypting password:', error);
        this.snackBar.open('Error encrypting password. Please try again.', 'Close', {
          duration: 3000,
        });
      }
    }
  }
  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }
  onCancel(): void {
    this.dialogRef.close();
  }
}
