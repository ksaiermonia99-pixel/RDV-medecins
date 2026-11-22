import { Component, inject } from '@angular/core';
import {
  AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators,
} from '@angular/forms';

type Role = 'patient' | 'medecin' | 'admin';
type Mode = 'login' | 'register';

function motDePasseFort(c: AbstractControl): ValidationErrors | null {
  const v: string = c.value ?? '';
  const ok = v.length >= 8 && /[A-Z]/.test(v) && /[a-z]/.test(v) && /\d/.test(v);
  return ok ? null : { faible: true };
}

function confirmationIdentique(g: AbstractControl): ValidationErrors | null {
  const conf = g.get('confirmation');
  if (!conf || conf.disabled) return null;
  return g.get('motDePasse')?.value === conf.value ? null : { different: true };
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  private fb = inject(FormBuilder);

  role: Role | null = null;
  mode: Mode = 'login';
  message = '';

  roles = [
    { value: 'patient' as Role, label: 'Patient', icon: '🧑' },
    { value: 'medecin' as Role, label: 'Médecin', icon: '🩺' },
    { value: 'admin' as Role, label: 'Administrateur', icon: '🛠️' },
  ];

  specialites = [
    'Médecine générale', 'Cardiologie', 'Dermatologie', 'Pédiatrie', 'Gynécologie',
    'Ophtalmologie', 'ORL', 'Orthopédie', 'Neurologie', 'Psychiatrie',
  ];

  form = this.fb.nonNullable.group(
    {
      cin: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      specialite: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      motDePasse: ['', Validators.required],
      confirmation: ['', Validators.required],
    },
    { validators: confirmationIdentique }
  );

  constructor() {
    this.refreshForm();
  }

  get roleLabel() {
    return this.roles.find(r => r.value === this.role)?.label ?? '';
  }

  chooseRole(r: Role) {
    this.role = r;
    this.mode = 'login';
    this.refreshForm();
  }

  changeRole() {
    this.role = null;
    this.mode = 'login';
    this.refreshForm();
  }

  setMode(m: Mode) {
    if (this.role === 'admin' && m === 'register') return; 
    this.mode = m;
    this.refreshForm();
  }

  invalid(name: string) {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { confirmation, ...donnees } = this.form.value;
    console.log(this.mode, { role: this.role, ...donnees });

    if (this.mode === 'register') {
      
      const msg = this.role === 'medecin'
        ? "Compte créé. Il sera activé après validation par l'administrateur."
        : 'Compte créé. Vous pouvez maintenant vous connecter.';
      this.setMode('login');
      this.message = msg;    
    } else {
      this.message = 'Connexion : à brancher sur le back-end.';
    }
  }

  private refreshForm() {
    this.message = '';
    this.form.reset();
    const f = this.form.controls;
    const inscription = this.mode === 'register';
    const toggle = (c: AbstractControl, on: boolean) => (on ? c.enable() : c.disable());

    toggle(f.nom, inscription);
    toggle(f.prenom, inscription);
    toggle(f.email, inscription);
    toggle(f.confirmation, inscription);
    toggle(f.specialite, inscription && this.role === 'medecin');

    f.motDePasse.setValidators(
      inscription ? [Validators.required, motDePasseFort] : [Validators.required]
    );
    f.motDePasse.updateValueAndValidity();
  }
}