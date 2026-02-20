PARA PDN
.firebaserc
{
  "projects": {
    "default": "lida-f59df"
  }
}

enviroments 
production: true


PARA DEV

{
  "projects": {
    "default": "lida-dev-f9291"
  }
}

enviroments 
production: false


HOST PDN

ng build --configuration production

https://lida-f59df.web.app/public/login


HOST DEV

https://lida-dev-f9291.web.app/public/login


  // { label: 'Super usuario', value: 'Super usuario', nivel: 100 },
  // { label: 'Coordinador nacional', value: 'Coordinador nacional', nivel: 90 },
  // { label: 'Coordinador departamental', value: 'Coordinador departamental', nivel: 80 },
  // { label: 'Coordinador de municipio', value: 'Coordinador de municipio', nivel: 70 },
  // { label: 'Pastor', value: 'Pastor', nivel: 60 },





Para salir DEV


Comando para hacer el PWA 

ng add @angular/pwa
deploy

