import { Routes } from '@angular/router';
import { ShellComponent } from './shell/shell.component';
import { HomeComponent } from './pages/home/home.component';
import { ProyectosComponent } from './pages/proyectos/proyectos.component';
import { HobbiesComponent } from './pages/hobbies/hobbies.component';
import { SobreMiComponent } from './pages/sobre-mi/sobre-mi.component';
import { ContactoComponent } from './pages/contacto/contacto.component';
import { CertificacionesComponent } from './pages/certificaciones/certificaciones.component';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'proyectos', component: ProyectosComponent },
      { path: 'hobbies', component: HobbiesComponent },
      { path: 'sobre-mi', component: SobreMiComponent },
      { path: 'contacto', component: ContactoComponent },
      { path: 'certificaciones', component: CertificacionesComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
